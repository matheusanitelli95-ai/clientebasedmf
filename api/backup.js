import admin from 'firebase-admin';

// ─── Firebase Admin (singleton) ────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'clientebasedmf.firebasestorage.app'
  });
}
var db = admin.firestore();

// ─── Helpers ───────────────────────────────────────────────────

// Converte Firestore Timestamps para ISO strings
function serializeDoc(data) {
  if (!data) return data;
  var result = {};
  for (var key in data) {
    var val = data[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      result[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = serializeDoc(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(function(item) {
        if (item && typeof item === 'object' && typeof item.toDate === 'function') {
          return item.toDate().toISOString();
        }
        if (item && typeof item === 'object') return serializeDoc(item);
        return item;
      });
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Formata data para nome do arquivo
function fmtDate(d) {
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yyyy = d.getFullYear();
  return yyyy + '-' + mm + '-' + dd;
}

// ─── Exportar coleção com subcoleções ──────────────────────────
async function exportCollection(colRef, maxSubcolDocs) {
  var snapshot = await colRef.get();
  var data = {};

  for (var doc of snapshot.docs) {
    var docData = serializeDoc(doc.data());

    // Buscar subcoleções (comentários, etc)
    try {
      var subcols = await doc.ref.listCollections();
      for (var subcol of subcols) {
        var subsnap = await subcol.limit(maxSubcolDocs || 500).get();
        if (!subsnap.empty) {
          if (!docData._subcollections) docData._subcollections = {};
          docData._subcollections[subcol.id] = {};
          for (var subdoc of subsnap.docs) {
            docData._subcollections[subcol.id][subdoc.id] = serializeDoc(subdoc.data());
          }
        }
      }
    } catch (e) {
      // Ignora erro de subcoleção
    }

    data[doc.id] = docData;
  }

  return { count: snapshot.size, data: data };
}

// ─── Google Drive Upload (opcional) ────────────────────────────
async function uploadToGoogleDrive(jsonString, filename) {
  // Usa as mesmas credenciais do Firebase (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
  var folderIdEnv = process.env.GOOGLE_DRIVE_FOLDER_ID;
  var clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  var privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!folderIdEnv || !clientEmail || !privateKey) {
    return { uploaded: false, reason: 'Google Drive não configurado (faltam GOOGLE_DRIVE_FOLDER_ID, FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY)' };
  }

  try {
    var serviceKey = { client_email: clientEmail, private_key: privateKey };

    // Obter access token via JWT
    var jwt = await createJWT(serviceKey);
    var tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
    });
    var tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      return { uploaded: false, reason: 'Falha ao obter access token: ' + JSON.stringify(tokenData) };
    }

    // Upload multipart para Google Drive
    var boundary = '----BackupBoundary' + Date.now();
    var metadata = JSON.stringify({
      name: filename,
      mimeType: 'application/json',
      parents: [folderIdEnv]
    });

    var body = '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/json\r\n\r\n' +
      jsonString + '\r\n' +
      '--' + boundary + '--';

    var uploadResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
      body: body
    });

    var uploadResult = await uploadResp.json();

    if (uploadResult.id) {
      return { uploaded: true, fileId: uploadResult.id, fileName: filename };
    }
    return { uploaded: false, reason: JSON.stringify(uploadResult) };

  } catch (e) {
    return { uploaded: false, reason: e.message };
  }
}

// Criar JWT para autenticação com service account
async function createJWT(serviceKey) {
  var header = { alg: 'RS256', typ: 'JWT' };
  var now = Math.floor(Date.now() / 1000);
  var payload = {
    iss: serviceKey.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  var headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  var payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  var unsigned = headerB64 + '.' + payloadB64;

  // Assinar com a chave privada do service account
  var crypto = await import('crypto');
  var sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  var signature = sign.sign(serviceKey.private_key, 'base64url');

  return unsigned + '.' + signature;
}

// ─── Limpar backups antigos (manter últimos N) ─────────────────
async function cleanOldBackups(bucket, keepLast) {
  try {
    var [files] = await bucket.getFiles({ prefix: 'backups/' });
    var jsonFiles = files
      .filter(function(f) { return f.name.endsWith('.json'); })
      .sort(function(a, b) { return b.name.localeCompare(a.name); });

    var toDelete = jsonFiles.slice(keepLast || 8); // Manter últimos 8 (2 meses)
    for (var file of toDelete) {
      await file.delete();
    }
    return toDelete.length;
  } catch (e) {
    return 0;
  }
}

// ─── Handler Principal ─────────────────────────────────────────
export default async function handler(req, res) {
  // Segurança: aceitar cron do Vercel ou secret manual
  var authHeader = req.headers.authorization;
  var cronSecret = process.env.CRON_SECRET;

  // Vercel cron envia o CRON_SECRET automaticamente
  if (cronSecret && authHeader !== 'Bearer ' + cronSecret) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Se não tem CRON_SECRET configurado, aceitar sem auth (para testes)

  var startTime = Date.now();

  try {
    var now = new Date();
    var dateStr = fmtDate(now);
    var backupResult = {
      timestamp: now.toISOString(),
      date: dateStr,
      project: 'clientebasedmf',
      collections: {},
      stats: {}
    };

    // ── 1. Exportar todas as coleções do Firestore ──
    var collections = await db.listCollections();
    var totalDocs = 0;
    var collectionNames = [];

    for (var col of collections) {
      var result = await exportCollection(col);
      backupResult.collections[col.id] = result.data;
      backupResult.stats[col.id] = result.count;
      totalDocs += result.count;
      collectionNames.push(col.id + ' (' + result.count + ')');
    }

    // ── 2. Incluir regras do Firestore (se disponíveis como env) ──
    if (process.env.FIRESTORE_RULES) {
      backupResult.firestoreRules = process.env.FIRESTORE_RULES;
    }

    // ── 3. Metadados ──
    backupResult.meta = {
      totalDocuments: totalDocs,
      totalCollections: collections.length,
      backupDurationMs: Date.now() - startTime,
      version: '1.0'
    };

    var jsonString = JSON.stringify(backupResult, null, 2);
    var sizeKB = Math.round(jsonString.length / 1024);

    // ── 4. Salvar no Firebase Storage ──
    var bucket = admin.storage().bucket();
    var storageFilename = 'backups/backup-' + dateStr + '.json';
    var file = bucket.file(storageFilename);

    await file.save(jsonString, {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'no-cache',
        customMetadata: {
          totalDocs: String(totalDocs),
          collections: String(collections.length),
          sizeKB: String(sizeKB)
        }
      }
    });

    // ── 5. Upload pro Google Drive (se configurado) ──
    var driveFilename = 'DMF-Backup-' + dateStr + '.json';
    var driveResult = await uploadToGoogleDrive(jsonString, driveFilename);

    // ── 6. Limpar backups antigos no Storage ──
    var deleted = await cleanOldBackups(bucket, 8);

    var duration = Date.now() - startTime;

    res.status(200).json({
      ok: true,
      timestamp: now.toISOString(),
      stats: {
        totalDocuments: totalDocs,
        totalCollections: collections.length,
        collections: collectionNames,
        sizeKB: sizeKB,
        durationMs: duration
      },
      storage: {
        saved: true,
        path: storageFilename
      },
      googleDrive: driveResult,
      cleanup: {
        oldBackupsDeleted: deleted
      }
    });

  } catch (err) {
    console.error('Erro no backup:', err);
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// setAdminClaim.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Inicializa o app Admin SDK
const adminApp = initializeApp({
  credential: cert(serviceAccount),
});

// Obter o Auth SDK a partir do app inicializado
const adminAuth = getAuth(adminApp);

async function setAdminClaim(uid) {
  if (!uid) {
    console.error('Erro: UID do usuário não fornecido.');
    console.log('Uso: node setAdminClaim.js <user_uid>');
    process.exit(1);
  }

  try {
    // 1. Definir o custom claim 'admin: true' diretamente usando o UID
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`Custom claim 'admin: true' definido para o usuário com UID: ${uid}`);

    // Opcional: Forçar a revogação de tokens antigos
    // await adminAuth.revokeRefreshTokens(uid);
    // console.log(`Tokens de refresh revogados para o usuário ${uid}. O usuário precisará logar novamente.`);

  } catch (error) {
    console.error(`Erro ao definir custom claim para o UID ${uid}:`, error);
  }
}

// Obter o UID do primeiro argumento da linha de comando
const targetUid = process.argv[2];

setAdminClaim(targetUid);

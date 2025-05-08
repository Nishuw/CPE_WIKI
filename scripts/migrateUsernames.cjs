
// migrateUsernames.cjs
const admin = require('firebase-admin');

// ===============================================================================================
// CONFIGURE AQUI:
// 1. Caminho para o seu arquivo JSON da chave da conta de serviço
//    Exemplo: const serviceAccount = require('./cpe-wiki-firebase-adminsdk.json');
//    OU defina a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
const serviceAccount = require('./serviceAccountKey.json'); // !!! MUDE PARA O NOME DO SEU ARQUIVO !!!
// 2. URL do seu banco de dados Firestore (encontrado nas configurações do projeto Firebase)
//    Exemplo: const databaseURL = 'https://SEU-PROJETO-ID.firebaseio.com';
const databaseURL = 'https://cpe-wiki.firebaseio.com'; // !!! VERIFIQUE E MUDE SE NECESSÁRIO !!!
// ===============================================================================================

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase Admin SDK já inicializado.');
  } else {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function fetchAllUsers() {
  const usersSnapshot = await db.collection('users').get();
  const usersMap = new Map();
  usersSnapshot.forEach(doc => {
    usersMap.set(doc.id, doc.data().username || 'Desconhecido');
  });
  console.log(`Encontrados ${usersMap.size} usuários.`);
  return usersMap;
}

async function migrateCollection(collectionName, usersMap) {
  console.log(`
Iniciando migração para a coleção: ${collectionName}`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em '${collectionName}'.`);
    return;
  }

  let batch = db.batch();
  let operationsInBatch = 0;
  const MAX_OPERATIONS_PER_BATCH = 400; // Firestore limita a 500 operações por batch
  let documentsProcessed = 0;
  let documentsUpdated = 0;

  for (const doc of snapshot.docs) {
    documentsProcessed++;
    const data = doc.data();
    let needsUpdate = false;
    const updatePayload = {};

    // Processar createdBy
    if (data.createdBy && !data.createdByUsername) {
      const createdByUsername = usersMap.get(data.createdBy) || 'Desconhecido';
      updatePayload.createdByUsername = createdByUsername;
      needsUpdate = true;
    }

    // Processar updatedBy
    if (data.updatedBy && !data.updatedByUsername) {
      const updatedByUsername = usersMap.get(data.updatedBy) || 'Desconhecido';
      updatePayload.updatedByUsername = updatedByUsername;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, updatePayload);
      operationsInBatch++;
      documentsUpdated++;
      // console.log(`Agendando atualização para ${collectionName}/${doc.id}:`, updatePayload);
    }

    if (operationsInBatch >= MAX_OPERATIONS_PER_BATCH) {
      console.log(`Commitando batch com ${operationsInBatch} operações para '${collectionName}'...`);
      await batch.commit();
      batch = db.batch();
      operationsInBatch = 0;
    }
  }

  if (operationsInBatch > 0) {
    console.log(`Commitando batch final com ${operationsInBatch} operações para '${collectionName}'...`);
    await batch.commit();
  }

  console.log(`Migração para '${collectionName}' concluída.`);
  console.log(`Documentos processados: ${documentsProcessed}`);
  console.log(`Documentos atualizados: ${documentsUpdated}`);
}

async function main() {
  console.log('Iniciando script de migração de nomes de usuário...');

  try {
    // 0. FAÇA UM BACKUP DO SEU BANCO DE DADOS ANTES DE CONTINUAR!
    console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.warn("!!! IMPORTANTE: Certifique-se de ter feito um backup do seu Firestore     !!!");
    console.warn("!!! antes de executar este script. Pressione Ctrl+C para cancelar agora.   !!!");
    console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    await new Promise(resolve => setTimeout(resolve, 7000)); // Pausa para ler o aviso

    const usersMap = await fetchAllUsers();

    if (usersMap.size === 0) {
      console.error("Nenhum usuário encontrado. Verifique a coleção 'users'. Saindo.");
      return;
    }

    await migrateCollection('topics', usersMap);
    await migrateCollection('contents', usersMap);

    console.log('Script de migração concluído com sucesso!'); // Linha realmente corrigida
  } catch (error) {
    console.error('Erro durante o script de migração:', error); // Linha realmente corrigida
  }
}

main();

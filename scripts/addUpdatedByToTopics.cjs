// scripts/addUpdatedByToTopics.js

// Importar o Firebase Admin SDK
const admin = require('firebase-admin');

// Substitua pelo caminho para o seu arquivo de chave de serviço do Firebase Admin SDK
// Certifique-se de manter este arquivo seguro e fora do controle de versão público.
const serviceAccount = require('./serviceAccountKey.json');

// Inicialize o aplicativo Firebase Admin
// Verifique se um aplicativo já não foi inicializado para evitar erros
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addUpdatedByToTopics() {
  console.log('Iniciando a migração para adicionar o campo updatedBy aos tópicos...');

  try {
    const topicsRef = db.collection('topics');
    const snapshot = await topicsRef.get();

    if (snapshot.empty) {
      console.log('Nenhum tópico encontrado.');
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    snapshot.forEach(doc => {
      const topicData = doc.data();
      // Verifica se o campo updatedBy já existe para evitar sobrescrever dados manuais,
      // embora para dados legados ele não deva existir.
      // Define updatedBy como createdBy para dados existentes.
      if (!topicData.updatedBy && topicData.createdBy) {
        const topicRef = topicsRef.doc(doc.id);
        batch.update(topicRef, { updatedBy: topicData.createdBy });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Migração concluída. ${updateCount} tópicos foram atualizados com o campo updatedBy.`);
    } else {
      console.log('Nenhum tópico precisou ser atualizado.');
    }

  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

addUpdatedByToTopics();
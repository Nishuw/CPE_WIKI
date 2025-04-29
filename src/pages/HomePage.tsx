import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { FolderIcon, BookOpenIcon } from 'lucide-react';

const HomePage: React.FC = () => {
  const { getChildTopics } = useContent();
  const rootTopics = getChildTopics(null);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo ao CPE - WIKI</h1>
        <p className="text-lg text-gray-600">
          Seu local central para organizar e acessar conteúdos importantes
       </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Main Categories</h2>
        
        {rootTopics.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {rootTopics.map(topic => (
              <Link 
                key={topic.id} 
                to={`/topics/${topic.id}`}
                className="block p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <FolderIcon size={24} className="text-blue-900 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-lg text-blue-900">{topic.title}</h3>
                    <p className="text-gray-600 mt-1">
                      Navegue pelo conteúdo nesta categoria
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Nenhuma categoria de conteúdo disponível ainda</p>
        )}
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-start">
          <BookOpenIcon size={24} className="text-blue-900 mr-3 mt-1" />
          <div>
            <h3 className="font-medium text-lg text-blue-900">Sobre o CPE - WIKI</h3>
            <p className="text-gray-600 mt-1">
              O CPE - WIKI é uma plataforma para organizar e acessar conteúdos importantes. 
              Navegue pelas categorias, veja informações detalhadas e encontre exatamente o que você precisa.
          </p>
       </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
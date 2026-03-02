import { v4 as uuidv4 } from 'uuid';

export const INITIAL_DATA = {
  tasks: {
    'task-1': {
      id: 'task-1',
      company: 'TechCorp SA',
      contact: 'João Silva',
      createdAt: new Date().toISOString(),
      history: [{ columnId: 'col-1', enteredAt: new Date().toISOString() }],
      checklist: [
        { id: 'chk-1', text: 'Analisar perfil no LinkedIn', completed: true },
        { id: 'chk-2', text: 'Encontrar email atualizado', completed: false }
      ],
      customFields: [
        { id: 'cf-1', label: 'Tamanho da Empresa', type: 'select', value: 'Enterprise' },
        { id: 'cf-2', label: 'Receita Esperada', type: 'currency', value: '500000' }
      ],
      attachments: []
    },
    'task-2': {
      id: 'task-2',
      company: 'Global Indústrias',
      contact: 'Maria Souza',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      history: [{ columnId: 'col-2', enteredAt: new Date(Date.now() - 86400000).toISOString() }],
      checklist: [],
      customFields: [],
      attachments: []
    }
  },
  columns: {
    'col-1': {
      id: 'col-1',
      title: 'Backlog de Inteligência',
      taskIds: ['task-1'],
      color: '#e2e8f0' // slate-200
    },
    'col-2': {
      id: 'col-2',
      title: 'Mapeamento & Hunting',
      taskIds: ['task-2'],
      color: '#fef08a' // yellow-200
    },
    'col-3': {
      id: 'col-3',
      title: 'Conexão LinkedIn',
      taskIds: [],
      color: '#bfdbfe' // blue-200
    },
    'col-4': {
      id: 'col-4',
      title: 'E-mail de Proposta',
      taskIds: [],
      color: '#e9d5ff' // purple-200
    },
    'col-5': {
      id: 'col-5',
      title: 'Cadência de Follow-up',
      taskIds: [],
      color: '#fed7aa' // orange-200
    },
    'col-6': {
      id: 'col-6',
      title: 'Reunião Marcada',
      taskIds: [],
      color: '#bbf7d0' // green-200
    },
    'col-7': {
      id: 'col-7',
      title: 'Nutrição',
      taskIds: [],
      color: '#fbcfe8' // pink-200
    }
  },
  columnOrder: ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7']
};

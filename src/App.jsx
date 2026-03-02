import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Search, LayoutDashboard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Board from './components/Board';
import CardModal from './components/CardModal';
import Login from './components/Login';
import { INITIAL_DATA } from './data/initialData';
import { supabase } from './lib/supabase';

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('kanban-data');
    if (saved) return JSON.parse(saved);
    return INITIAL_DATA;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('kanban-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch columns
      const { data: cols, error: colsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position', { ascending: true });

      if (colsError) throw colsError;

      // Fetch tasks
      const { data: tks, error: tksError } = await supabase
        .from('kanban_tasks')
        .select('*')
        .order('position', { ascending: true });

      if (tksError) throw tksError;

      if (cols && cols.length > 0) {
        const columns = {};
        const tasks = {};
        const columnOrder = cols.map(c => c.id);

        cols.forEach(c => {
          columns[c.id] = {
            ...c,
            taskIds: tks.filter(t => t.column_id === c.id).map(t => t.id)
          };
        });

        tks.forEach(t => {
          tasks[t.id] = {
            ...t,
            columnId: t.column_id // mapped for internal use
          };
        });

        setData({ tasks, columns, columnOrder });
      } else {
        // If DB is empty, use initial data (optional: seed DB)
        setData(INITIAL_DATA);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Fallback to localStorage if error
      const saved = localStorage.getItem('kanban-data');
      if (saved) setData(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kanban-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kanban-user');
    }
  }, [currentUser]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    if (type === 'column') {
      const newColumnOrder = Array.from(data.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      setData({
        ...data,
        columnOrder: newColumnOrder,
      });

      // Persist column order
      const updates = newColumnOrder.map((id, index) =>
        supabase.from('kanban_columns').update({ position: index }).eq('id', id)
      );
      await Promise.all(updates);
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });

      // Persist task order in same column
      const updates = newTaskIds.map((id, index) =>
        supabase.from('kanban_tasks').update({ position: index }).eq('id', id)
      );
      await Promise.all(updates);
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    // Log the move in task history
    const task = data.tasks[draggableId];
    const newHistory = [...(task.history || []), { columnId: newFinish.id, enteredAt: new Date().toISOString() }];

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
      tasks: {
        ...data.tasks,
        [task.id]: {
          ...task,
          history: newHistory
        }
      }
    });

    // Persist task movement to another column
    await supabase.from('kanban_tasks').update({
      column_id: newFinish.id,
      history: newHistory
    }).eq('id', draggableId);

    // Update positions in both columns
    const startUpdates = startTaskIds.map((id, index) =>
      supabase.from('kanban_tasks').update({ position: index }).eq('id', id)
    );
    const finishUpdates = finishTaskIds.map((id, index) =>
      supabase.from('kanban_tasks').update({ position: index }).eq('id', id)
    );
    await Promise.all([...startUpdates, ...finishUpdates]);
  };

  const updateTask = async (taskId, updatedTask) => {
    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: updatedTask
      }
    }));
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(updatedTask);
    }

    // Persist to Supabase
    const { id, columnId, ...dbTask } = updatedTask; // remove helper fields
    await supabase.from('kanban_tasks').update({
      company: dbTask.company,
      contact: dbTask.contact,
      checklist: dbTask.checklist,
      custom_fields: dbTask.customFields,
      attachments: dbTask.attachments,
      comments: dbTask.comments,
      history: dbTask.history
    }).eq('id', taskId);
  };

  const addComment = async (taskId, text) => {
    const task = data.tasks[taskId];
    const newComment = {
      id: `comm-${uuidv4()}`,
      text,
      authorId: currentUser.email,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      createdAt: new Date().toISOString()
    };

    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newComment]
    };

    await updateTask(taskId, updatedTask);
  };

  const addTask = async () => {
    const firstColumnId = data.columnOrder[0];
    const firstColumn = data.columns[firstColumnId];

    const newTask = {
      id: `task-${uuidv4()}`,
      company: 'Nova Empresa',
      contact: 'Nome do Contato',
      createdAt: new Date().toISOString(),
      history: [{ columnId: firstColumnId, enteredAt: new Date().toISOString() }],
      checklist: [],
      customFields: [],
      attachments: [],
      comments: [],
      column_id: firstColumnId,
      position: 0
    };

    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [newTask.id]: { ...newTask, customFields: [] } // maintain internal casing
      },
      columns: {
        ...prev.columns,
        [firstColumnId]: {
          ...firstColumn,
          taskIds: [newTask.id, ...firstColumn.taskIds]
        }
      }
    }));

    // Persist to Supabase
    await supabase.from('kanban_tasks').insert([{
      id: newTask.id,
      company: newTask.company,
      contact: newTask.contact,
      column_id: firstColumnId,
      position: 0,
      checklist: [],
      custom_fields: [],
      attachments: [],
      history: newTask.history,
      comments: [],
      creator_email: currentUser.email
    }]);

    setActiveTask({ ...newTask, customFields: [] });
  };

  const duplicateTask = async (task) => {
    const currentColumnId = task.history[task.history.length - 1].columnId;
    const currentColumn = data.columns[currentColumnId];

    const newTask = {
      ...JSON.parse(JSON.stringify(task)),
      id: `task-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      history: [{ columnId: currentColumnId, enteredAt: new Date().toISOString() }],
      company: `${task.company} (Cópia)`,
      position: 0
    };

    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [newTask.id]: newTask
      },
      columns: {
        ...prev.columns,
        [currentColumnId]: {
          ...currentColumn,
          taskIds: [newTask.id, ...currentColumn.taskIds]
        }
      }
    }));

    // Persist to Supabase
    await supabase.from('kanban_tasks').insert([{
      id: newTask.id,
      company: newTask.company,
      contact: newTask.contact,
      column_id: currentColumnId,
      position: 0,
      checklist: newTask.checklist,
      custom_fields: newTask.customFields,
      attachments: newTask.attachments,
      history: newTask.history,
      comments: newTask.comments,
      creator_email: currentUser.email
    }]);

    setActiveTask(newTask);
  };

  const updateColumn = async (columnId, updates) => {
    setData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          ...updates
        }
      }
    }));

    // Persist to Supabase
    const dbUpdates = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.color) dbUpdates.color = updates.color;
    if (updates.coverColor !== undefined) dbUpdates.cover_color = updates.coverColor;
    if (updates.coverText !== undefined) dbUpdates.cover_text = updates.coverText;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('kanban_columns').update(dbUpdates).eq('id', columnId);
    }
  };

  const addColumn = async () => {
    const newColumnId = `col-${uuidv4()}`;
    const position = data.columnOrder.length;
    const newColumn = {
      id: newColumnId,
      title: 'Nova Fila',
      taskIds: [],
      color: '#cbd5e1',
      position
    };

    setData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [newColumnId]: newColumn
      },
      columnOrder: [...prev.columnOrder, newColumnId]
    }));

    // Persist to Supabase
    await supabase.from('kanban_columns').insert([{
      id: newColumnId,
      title: newColumn.title,
      color: newColumn.color,
      position
    }]);
  };

  const deleteColumn = async (columnId) => {
    const column = data.columns[columnId];
    if (column.taskIds.length > 0) {
      if (!window.confirm('Esta fila contém cards. Tem certeza que deseja excluí-la? Todos os cards nela serão perdidos.')) {
        return;
      }
    }

    setData(prev => {
      const newColumns = { ...prev.columns };
      delete newColumns[columnId];

      const newTaskIds = column.taskIds;
      const newTasks = { ...prev.tasks };
      newTaskIds.forEach(id => delete newTasks[id]);

      const newColumnOrder = prev.columnOrder.filter(id => id !== columnId);

      return {
        ...prev,
        columns: newColumns,
        tasks: newTasks,
        columnOrder: newColumnOrder
      };
    });

    // Persist to Supabase
    await supabase.from('kanban_columns').delete().eq('id', columnId);
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="avatar" style={{ margin: '0 auto 1rem', width: '48px', height: '48px', animation: 'pulse 1.5s infinite' }}>...</div>
          <p>Carregando seu Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <LayoutDashboard className="text-primary" />
          CRM Prospecto
        </div>
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por empresa ou contato..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '1rem' }}>
            <div className="avatar" style={{ margin: 0 }}>{currentUser.avatar}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: 1 }}>{currentUser.name}</span>
              <button
                onClick={() => setCurrentUser(null)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--danger-color)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left' }}
              >
                Sair
              </button>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={addColumn}>+ Nova Fila</button>
          <button className="btn btn-primary" onClick={addTask}>+ Novo Lead</button>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {provided => (
            <div
              className="board-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {data.columnOrder.map((columnId, index) => {
                const column = data.columns[columnId];
                const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

                // Filter tasks by query
                const filteredTasks = tasks.filter(task =>
                  task.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  task.contact.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <Board
                    key={column.id}
                    column={column}
                    tasks={filteredTasks}
                    index={index}
                    onCardClick={setActiveTask}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {activeTask && (
        <CardModal
          task={activeTask}
          currentUser={currentUser}
          onClose={() => setActiveTask(null)}
          onUpdate={updateTask}
          onDuplicate={duplicateTask}
          onAddComment={addComment}
          columns={data.columns}
        />
      )}
    </div>
  );
}

export default App;

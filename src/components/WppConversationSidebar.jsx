import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select';
import WppConversationList from './WppConversationList';
import InitiateConversationModal from './InitiateConversationModal';
import WppTagInputModal from './WppTagInputModal';
import { addTagToConversation, markConversationAsUnread } from '../services/api';

const formatUserLabel = (user) =>
  user.extension_3cx ? `${user.full_name} (${user.extension_3cx})` : user.full_name;

const selectStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: '32px',
    fontSize: '13px',
    borderColor: '#d1d5db',
    '&:hover': { borderColor: '#9ca3af' },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 8px',
  }),
  input: (provided) => ({
    ...provided,
    fontSize: '13px',
    margin: '0',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13px',
    backgroundColor: state.isSelected ? '#dcfce7' : state.isFocused ? '#f0fdf4' : provided.backgroundColor,
    color: state.isSelected ? '#166534' : provided.color,
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '13px',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: '0 4px',
  }),
  clearIndicator: (provided) => ({
    ...provided,
    padding: '0 4px',
  }),
  group: (provided) => ({
    ...provided,
    paddingTop: 0,
  }),
  groupHeading: (provided) => ({
    ...provided,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#6b7280',
    padding: '4px 8px',
  }),
};

const WppConversationSidebar = ({
  conversations,
  isLoading,
  selectedConversation,
  onSelectConversation,
  userRole,
  onConversationInitiated,
  onSearch,
  searchTerm,
  activeFilter,
  onFilterChange,
  onLoadMore,
  hasMore,
  showFilters,
  showCoordinatorDropdown,
  teamMembers,
  coordinators,
  serverFilter,
  onServerFilterChange,
  coordinatorFilter,
  onCoordinatorFilterChange,
  isLoadingFilters,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [taggingConversationId, setTaggingConversationId] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleAddTag = (conversationId) => {
    setTaggingConversationId(conversationId);
    setIsTagModalOpen(true);
  };

  const handleConfirmAddTag = async (tagName) => {
    if (!taggingConversationId || !tagName) return;
    try {
      await addTagToConversation(taggingConversationId, tagName);
      onConversationInitiated(); // Re-fetch all conversations
    } catch (error) {
      alert('Error al agregar etiqueta: ' + error.message);
    } finally {
      setIsTagModalOpen(false);
      setTaggingConversationId(null);
    }
  };

  const handleMarkAsUnread = async (conversationId) => {
    try {
      await markConversationAsUnread(conversationId);
      onConversationInitiated(); // Re-fetch all conversations
    } catch (error) {
      alert('Error al marcar como no leído: ' + error.message);
    } finally {
      setContextMenu(null);
    }
  };

  const handleContextMenu = (event, conversation) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      conversationId: conversation.id,
    });
  };

  const getButtonClass = (filterName) => (
    activeFilter === filterName
      ? "px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-300 rounded-full"
      : "px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
  );

  const segmentOptions = useMemo(() => {
    const options = [
      { value: null, label: 'Todos' },
    ];

    if (coordinatorFilter) {
      options.push({ value: 'team', label: 'Mi equipo' });
    }

    options.push(
      { value: 'ambiguous', label: 'Varios clientes' },
      { value: 'unknown', label: 'Desconocidos' }
    );

    // Individual gestores
    const gestores = (teamMembers || [])
      .map(m => ({
        value: `gestor:${m.id}`,
        label: formatUserLabel(m),
      }));

    if (gestores.length > 0) {
      options.push(...gestores);
    }

    return options;
  }, [teamMembers, coordinatorFilter]);

  const coordinatorOptions = useMemo(() => {
    const options = [{ value: null, label: 'Todos los coordinadores' }];
    (coordinators || []).forEach(c => {
      options.push({ value: c.id, label: formatUserLabel(c) });
    });
    return options;
  }, [coordinators]);

  const currentSegmentValue = useMemo(() => {
    if (!serverFilter) return segmentOptions[0];
    return segmentOptions.find(o => o.value === serverFilter) || segmentOptions[0];
  }, [serverFilter, segmentOptions]);

  const currentCoordinatorValue = useMemo(() => {
    if (!coordinatorFilter) return coordinatorOptions[0];
    return coordinatorOptions.find(o => o.value === coordinatorFilter) || coordinatorOptions[0];
  }, [coordinatorFilter, coordinatorOptions]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Conversaciones</h2>
        {userRole !== 'Gestor' && (
          <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200" title="Iniciar nueva conversación">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
      <InitiateConversationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConversationInitiated={onConversationInitiated} />
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o cédula..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {showFilters && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 space-y-2">
          {showCoordinatorDropdown && (
            <Select
              value={currentCoordinatorValue}
              onChange={(option) => onCoordinatorFilterChange(option?.value ?? null)}
              options={coordinatorOptions}
              styles={selectStyles}
              isClearable={false}
              isDisabled={isLoadingFilters}
              placeholder="Coordinador..."
              className="text-sm"
            />
          )}
          <Select
            value={currentSegmentValue}
            onChange={(option) => onServerFilterChange(option?.value ?? null)}
            options={segmentOptions}
            styles={selectStyles}
            isClearable={false}
            isDisabled={isLoadingFilters}
            placeholder="Filtrar por..."
            className="text-sm"
          />
        </div>
      )}

      <div className="flex justify-around p-3 bg-gray-100 border-b border-gray-200">
        <button className={getButtonClass('Nuevos')} onClick={() => onFilterChange('Nuevos')}>Nuevos</button>
        <button className={getButtonClass('Activos')} onClick={() => onFilterChange('Activos')}>Activos</button>
        <button className={getButtonClass('Todos')} onClick={() => onFilterChange('Todos')}>Todos</button>
      </div>
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <WppConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          userRole={userRole}
          onAddTag={handleAddTag}
          scrollContainerRef={scrollContainerRef}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          onContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 bg-white rounded-md shadow-lg border"
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleMarkAsUnread(contextMenu.conversationId)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Marcar como no leído
          </button>
        </div>
      )}
      <WppTagInputModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSubmit={handleConfirmAddTag}
      />
    </div>
  );
};

export default WppConversationSidebar;

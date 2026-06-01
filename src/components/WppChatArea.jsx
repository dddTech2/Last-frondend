import React from 'react';
import WppChatHeader from './WppChatHeader';
import WppMessageList from './WppMessageList';
import WppMessageInput from './WppMessageInput';

const WppChatArea = ({
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleMediaFileSelect,
  selectedMediaFile,
  handleSendMedia,
  handleCancelMedia,
  isUploadingMedia,
  onDocumentClick,
  messagesEndRef,
  messagesContainerRef,
  showScrollButton,
  scrollToBottom,
  isLoadingMessages,
  isLoadingOlderMessages,
  hasMoreMessages,
  onLoadOlderMessages, // <-- Añadir nueva prop
  isSessionExpired,
  onOpenExpiredSessionModal,
  selectedTemplate,
  selectedObligation,
  onCancelTemplate,
  adminfoData,
  handleViewInAdminfo,
  wppProfileData,      // <-- Nueva prop de perfil
  isLoadingWppProfile  // <-- Nueva prop de estado de carga
}) => {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-transparent" style={{ background: 'transparent' }}>
      <WppChatHeader
        selectedConversation={selectedConversation}
        adminfoData={adminfoData}
        handleViewInAdminfo={handleViewInAdminfo}
        wppProfileData={wppProfileData}
        isLoadingWppProfile={isLoadingWppProfile}
      />

      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <WppMessageList
          messages={messages}
          selectedConversation={selectedConversation}
          onDocumentClick={onDocumentClick}
          messagesEndRef={messagesEndRef}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          isLoadingMessages={isLoadingMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          hasMoreMessages={hasMoreMessages}
          onLoadOlderMessages={onLoadOlderMessages} // <-- Pasar prop
        />
      </div>

      <WppMessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleMediaFileSelect={handleMediaFileSelect}
        selectedMediaFile={selectedMediaFile}
        handleSendMedia={handleSendMedia}
        handleCancelMedia={handleCancelMedia}
        isUploadingMedia={isUploadingMedia}
        selectedConversation={selectedConversation}
        isSessionExpired={isSessionExpired}
        onOpenExpiredSessionModal={onOpenExpiredSessionModal}
        selectedTemplate={selectedTemplate}
        selectedObligation={selectedObligation}
        onCancelTemplate={onCancelTemplate}
      />
    </div>
  );
};

export default WppChatArea;

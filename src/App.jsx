import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AppModal from './components/AppModal';
import AppSidebar from './components/AppSidebar';
import ChatView from './components/ChatView';
import FilesView from './components/FilesView';
import ImageView from './components/ImageView';
import LoginScreen from './components/LoginScreen';
import { exportToFile } from './lib/fileGenerator';
import { normalizeImageUpload } from './lib/imageUpload';
import { auth, generateImage, processWithAI, supabase } from './lib/services';
import './App.css';

const initialModalState = {
  show: false,
  type: '',
  title: '',
  value: '',
  onConfirm: null,
};

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedModel, setSelectedModel] = useState('openai-v5');
  const [input, setInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRef, setImageRef] = useState(null);
  const [imageEngine, setImageEngine] = useState('dalle');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [fileManagementData, setFileManagementData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modal, setModal] = useState(initialModalState);
  const chatAbortRef = useRef(null);
  const imageAbortRef = useRef(null);

  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) {
        return;
      }
      setSession(currentSession);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!currentUserId) {
      setProjects([]);
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando proyectos:', error);
      return;
    }

    setProjects(data ?? []);
  }, [currentUserId]);

  const fetchIndependentChats = useCallback(async () => {
    if (!currentUserId) {
      setChats([]);
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', currentUserId)
      .is('project_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando chats independientes:', error);
      return;
    }

    const nextChats = data ?? [];
    setChats(nextChats);
    setActiveChat((currentChat) => {
      if (!nextChats.length) {
        return null;
      }
      const stillExists = currentChat && nextChats.some((chat) => chat.id === currentChat.id);
      return stillExists ? currentChat : nextChats[0];
    });
  }, [currentUserId]);

  const fetchChats = useCallback(async (projectId) => {
    if (!currentUserId) {
      setChats([]);
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando chats del proyecto:', error);
      return;
    }

    const nextChats = data ?? [];
    setChats(nextChats);
    setActiveChat(nextChats[0] ?? null);
  }, [currentUserId]);

  const fetchMessages = useCallback(async (chatId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando mensajes:', error);
      return;
    }

    setMessages(data ?? []);
  }, [currentUserId]);

  const fetchFilesFromMessages = useCallback(async () => {
    if (!currentUserId) {
      setFileManagementData([]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', currentUserId)
      .not('attachment_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando archivos:', error);
      return;
    }

    setFileManagementData(data ?? []);
  }, [currentUserId]);

  useEffect(() => {
    if (!session) {
      setProjects([]);
      setChats([]);
      setMessages([]);
      setFileManagementData([]);
      setActiveProject(null);
      setActiveChat(null);
      return;
    }

    fetchProjects();
    fetchIndependentChats();
  }, [fetchIndependentChats, fetchProjects, session]);

  useEffect(() => {
    setActiveTab('chat');
    if (!session) {
      return;
    }
    if (activeProject) {
      fetchChats(activeProject.id);
      return;
    }
    fetchIndependentChats();
  }, [activeProject, fetchChats, fetchIndependentChats, session]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChat.id);
  }, [activeChat, fetchMessages]);

  useEffect(() => {
    if (activeTab === 'files') {
      fetchFilesFromMessages();
    }
  }, [activeTab, fetchFilesFromMessages]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 961px)');
    const syncSidebarState = (event) => {
      setIsSidebarOpen(event.matches);
    };

    syncSidebarState(mediaQuery);
    mediaQuery.addEventListener('change', syncSidebarState);

    return () => mediaQuery.removeEventListener('change', syncSidebarState);
  }, []);

  useEffect(() => () => {
    chatAbortRef.current?.abort();
    imageAbortRef.current?.abort();
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((current) => !current);
  }, []);

  const cancelChatProcessing = useCallback(() => {
    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
      chatAbortRef.current = null;
    }
    setIsTyping(false);
  }, []);

  const cancelImageProcessing = useCallback(() => {
    if (imageAbortRef.current) {
      imageAbortRef.current.abort();
      imageAbortRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const openModal = useCallback((type, title, initialValue, onConfirm) => {
    setModal({ show: true, type, title, value: initialValue, onConfirm });
  }, []);

  const closeModal = useCallback(() => {
    setModal(initialModalState);
  }, []);

  const confirmModal = useCallback(async () => {
    if (typeof modal.onConfirm === 'function') {
      await modal.onConfirm(modal.value);
    }
    closeModal();
  }, [closeModal, modal]);

  const handleAuth = useCallback(async (event) => {
    event.preventDefault();
    if (isRegistering) {
      const { data, error } = await auth.signUp(loginForm.email, loginForm.password);
      if (error) {
        alert(`Error al registrar: ${error.message}`);
        return;
      }
      if (data.user && data.session) {
        alert('¡Registro exitoso! Iniciando sesión...');
        return;
      }
      alert('Revisa tu correo para confirmar la cuenta (si es necesario).');
      return;
    }

    const { error } = await auth.signIn(loginForm.email, loginForm.password);
    if (error) {
      alert(`Error de acceso: ${error.message}`);
    }
  }, [isRegistering, loginForm.email, loginForm.password]);

  const handleLogout = useCallback(async () => {
    cancelChatProcessing();
    cancelImageProcessing();
    await auth.signOut();
    setSession(null);
  }, [cancelChatProcessing, cancelImageProcessing]);

  const handleCreateProject = useCallback(() => {
    openModal('input', 'Crear Nuevo Proyecto', '', async (name) => {
      const trimmedName = name.trim();
      if (!trimmedName || !currentUserId) {
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: trimmedName, user_id: currentUserId }])
        .select();

      if (error) {
        console.error('Error creando proyecto:', error);
        return;
      }

      if (data?.[0]) {
        setProjects((previous) => [data[0], ...previous]);
        setActiveProject(data[0]);
      }
    });
  }, [currentUserId, openModal]);

  const handleEditProject = useCallback((event, project) => {
    event.stopPropagation();
    openModal('input', 'Renombrar Proyecto', project.name, async (nextName) => {
      const trimmedName = nextName.trim();
      if (!trimmedName || trimmedName === project.name) {
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({ name: trimmedName })
        .eq('id', project.id)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error actualizando proyecto:', error);
        return;
      }

      setProjects((previous) => previous.map((item) => (
        item.id === project.id ? { ...item, name: trimmedName } : item
      )));

      if (activeProject?.id === project.id) {
        setActiveProject({ ...activeProject, name: trimmedName });
      }
    });
  }, [activeProject, currentUserId, openModal]);

  const handleDeleteProject = useCallback((event, projectId) => {
    event.stopPropagation();
    openModal('confirm', 'Eliminar Proyecto', '¿Estás seguro de que quieres borrar este proyecto y todos sus chats?', async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error eliminando proyecto:', error);
        return;
      }

      setProjects((previous) => previous.filter((project) => project.id !== projectId));
      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveChat(null);
      }
    });
  }, [activeProject, currentUserId, openModal]);

  const createNewChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setActiveTab('chat');
    setInput('');
    if (window.matchMedia('(max-width: 960px)').matches) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleDeleteChat = useCallback((event, chatId) => {
    event.stopPropagation();
    openModal('confirm', 'Eliminar Chat', '¿Borrar esta conversación para siempre?', async () => {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error eliminando chat:', error);
        return;
      }

      setChats((previous) => previous.filter((chat) => chat.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    });
  }, [activeChat, currentUserId, openModal]);

  const deleteMessageFile = useCallback(async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .update({ attachment_url: null, attachment_name: null })
      .eq('id', messageId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error eliminando archivo del mensaje:', error);
      return;
    }

    setFileManagementData((previous) => previous.filter((message) => message.id !== messageId));
  }, [currentUserId]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachment) || !currentUserId) {
      return;
    }

    cancelChatProcessing();

    let currentChat = activeChat;
    if (!currentChat) {
      const title = input.trim().slice(0, 30) || 'Nuevo Chat';
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          project_id: activeProject?.id || null,
          title,
          user_id: currentUserId,
        }])
        .select();

      if (error || !data?.[0]) {
        console.error('Error creando chat:', error);
        return;
      }

      currentChat = data[0];
      setChats((previous) => [currentChat, ...previous]);
      setActiveChat(currentChat);
    }

    const currentAttachment = attachment;
    const userMessage = {
      chat_id: currentChat.id,
      project_id: activeProject?.id || null,
      user_id: currentUserId,
      role: 'user',
      content: input,
      model: selectedModel,
      attachment_url: currentAttachment?.url || null,
      attachment_name: currentAttachment?.name || null,
    };

    const conversation = [...messages, userMessage];
    const controller = new AbortController();
    chatAbortRef.current = controller;

    setMessages(conversation);
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    try {
      const { error: insertUserMessageError } = await supabase.from('messages').insert([userMessage]);
      if (insertUserMessageError) {
        throw insertUserMessageError;
      }

      const stream = await processWithAI(selectedModel, conversation, currentAttachment, {
        signal: controller.signal,
      });
      let assistantContent = '';

      setMessages((previous) => [...previous, { role: 'assistant', content: '', model: selectedModel }]);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantContent += content;
        setMessages((previous) => {
          const lastMessage = previous[previous.length - 1];
          return [...previous.slice(0, -1), { ...lastMessage, content: assistantContent }];
        });
      }

      const { error: insertAssistantError } = await supabase.from('messages').insert([{
        chat_id: currentChat.id,
        project_id: activeProject?.id || null,
        user_id: currentUserId,
        role: 'assistant',
        content: assistantContent,
        model: selectedModel,
      }]);

      if (insertAssistantError) {
        throw insertAssistantError;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessages(conversation);
        return;
      }
      console.error('Error enviando mensaje:', error);
      alert(`No se pudo completar la solicitud: ${error.message || 'error desconocido'}`);
      setMessages(conversation);
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
      }
      setIsTyping(false);
    }
  }, [activeChat, activeProject, attachment, cancelChatProcessing, currentUserId, input, messages, selectedModel]);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const normalizedFile = await normalizeImageUpload(file);
      setAttachment(normalizedFile);
    } catch (error) {
      alert(error.message || 'No se pudo preparar la imagen seleccionada.');
      event.target.value = '';
    }
  }, []);

  const handleRefImageChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const normalizedFile = await normalizeImageUpload(file);
      setImageRef(normalizedFile);
    } catch (error) {
      alert(error.message || 'No se pudo preparar la imagen de referencia.');
      event.target.value = '';
    }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim()) {
      alert('Por favor, ingresa una descripción para la imagen.');
      return;
    }

    cancelImageProcessing();
    const controller = new AbortController();
    imageAbortRef.current = controller;

    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const url = await generateImage(imagePrompt, imageRef, imageEngine, {
        signal: controller.signal,
      });
      setGeneratedImageUrl(url);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error generando imagen:', error);
      alert(`Error: ${error.message || 'Error desconocido al generar la imagen'}`);
    } finally {
      if (imageAbortRef.current === controller) {
        imageAbortRef.current = null;
      }
      setIsGenerating(false);
    }
  }, [cancelImageProcessing, imageEngine, imagePrompt, imageRef]);

  const handleInputKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const filteredChats = useMemo(
    () => chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [chats, searchQuery],
  );

  if (authLoading) {
    return <div className="loading-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!session) {
    return (
      <LoginScreen
        isRegistering={isRegistering}
        showPassword={showPassword}
        loginForm={loginForm}
        onToggleRegistering={() => setIsRegistering((current) => !current)}
        onToggleShowPassword={() => setShowPassword((current) => !current)}
        onSubmit={handleAuth}
        onChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
      />
    );
  }

  return (
    <div className="app-container">
      <AppSidebar
        activeProject={activeProject}
        activeTab={activeTab}
        filteredChats={filteredChats}
        isSidebarOpen={isSidebarOpen}
        projects={projects}
        searchQuery={searchQuery}
        setActiveChat={setActiveChat}
        setActiveProject={setActiveProject}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
        toggleSidebar={toggleSidebar}
        activeChat={activeChat}
        onCreateProject={handleCreateProject}
        onCreateChat={createNewChat}
        onDeleteChat={handleDeleteChat}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleEditProject}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <ChatView
              activeChat={activeChat}
              activeProject={activeProject}
              attachment={attachment}
              input={input}
              isTyping={isTyping}
              messages={messages}
              onAttachmentChange={handleFileChange}
              onExport={exportToFile}
              onInputChange={setInput}
              onKeyDown={handleInputKeyDown}
              onRemoveAttachment={() => setAttachment(null)}
              onSend={handleSend}
              onStop={cancelChatProcessing}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          ) : activeTab === 'images' ? (
            <ImageView
              generatedImageUrl={generatedImageUrl}
              imageEngine={imageEngine}
              imagePrompt={imagePrompt}
              imageRef={imageRef}
              isGenerating={isGenerating}
              onGenerate={handleGenerateImage}
              onImagePromptChange={setImagePrompt}
              onRefImageChange={handleRefImageChange}
              onRemoveRef={() => setImageRef(null)}
              onStop={cancelImageProcessing}
              setImageEngine={setImageEngine}
            />
          ) : (
            <FilesView
              fileManagementData={fileManagementData}
              onDeleteFile={deleteMessageFile}
            />
          )}
        </AnimatePresence>
      </main>

      <AppModal
        modal={modal}
        onClose={closeModal}
        onChange={(value) => setModal((current) => ({ ...current, value }))}
        onConfirm={confirmModal}
      />
    </div>
  );
}

export default App;

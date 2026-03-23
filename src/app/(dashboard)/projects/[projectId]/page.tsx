"use client";

import { ConversationsList } from '@/src/components/projects/ConversationsList';
import React, { use, useState } from 'react';
import { KnowledgeBaseSidebar } from '@/src/components/projects/KnowledgeBaseSidebar';
import { FileDetailsModal } from '@/src/components/projects/FileDetailsModal';
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { apiClient } from "@/src/lib/api";
import { useEffect } from "react";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { NotFound } from "@/src/components/ui/NotFound";
import { Project, Chat, ProjectDocument, ProjectSettings } from "@/src/lib/types";


interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

interface ProjectData {
  project: Project | null;
  chats: Chat[];
  documents: ProjectDocument[];
  settings: ProjectSettings | null;
}

function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params);
  const { getToken, userId } = useAuth();


  // Data State
  const [data, setData] = useState<ProjectData>({
    project: null,
    chats: [],
    documents: [],
    settings: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // UI states
  const [activeTab, setActiveTab] = useState<"documents" | "settings">(
    "documents"
  );

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const [projectRes, chatsRes, documentsRes, settingsRes] =
          await Promise.all([
            apiClient.get(`/api/projects/${projectId}`, token),
            apiClient.get(`/api/projects/${projectId}/chats`, token),
            apiClient.get(`/api/projects/${projectId}/files`, token),
            apiClient.get(`/api/projects/${projectId}/settings`, token),
          ]);

        setData({
          project: projectRes.data,
          chats: chatsRes.data,
          documents: documentsRes.data,
          settings: settingsRes.data,
        });
      } catch (err) {
        setError("Failed to fetch data");
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [userId, projectId]);







  //   Chat-related methods
  const handleCreateNewChat = async () => {
    if (!userId) return;
    try {
      setIsCreatingChat(true);

      const token = await getToken();

      const chatNumber = Date.now() % 10000;

      const result = await apiClient.post(
        "/api/chats",
        {
          title: `Chat #${chatNumber}`,
          project_id: projectId,
        },
        token
      );

      const savedChat = result.data;

      // Update local state
      setData((prev) => ({
        ...prev,
        chats: [savedChat, ...prev.chats],
      }));

      toast.success("Chat Created successfully");
    } catch (err) {
      toast.error("Failed to create chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!userId) return;

    try {
      const token = await getToken();

      await apiClient.delete(`/api/chats/${chatId}`, token);

      // Update local state
      setData((prev) => ({
        ...prev,
        chats: prev.chats.filter((chat) => chat.id !== chatId),
      }));

      toast.success("Chat deleted successfully");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const handleChatClick = (chatId: string) => {
    console.log("Navigate to chat:", chatId);
  };

  //   Document-related methods
  const handleDocumentUpload = async (files: File[]) => {
    console.log("Upload files", files);
  };

  const handleDocumentDelete = async (documentId: string) => {
    console.log("Document Deleted");
  };

  const handleUrlAdd = async (url: string) => {
    console.log("Add URL", url);
  };

  const handleOpenDocument = (documentId: string) => {
    console.log("Open document", documentId);
    setSelectedDocumentId(documentId);
  };

  // Project settings

  const handleDraftSettings = (updates: any) => {
    console.log("Update local state with draft settings", updates);
  };

  const handlePublishSettings = async () => {
    console.log("Make API call to publish settings");
  };

  if (loading) {
    return <LoadingSpinner message="Loading project..." />;
  }

   if (!data.project) {
    return <NotFound message="Project not found" />;
  }

  const selectedDocument = selectedDocumentId
    ? data.documents.find((doc) => doc.id == selectedDocumentId)
    : null;

  return (
    <>
      <div className="flex h-screen bg-[#0d1117] gap-4 p-4">
        <ConversationsList
          project={data.project}
          conversations={data.chats}
          error={null}
          loading={isCreatingChat}
          onCreateNewChat={handleCreateNewChat}
          onChatClick={handleChatClick}
          onDeleteChat={handleDeleteChat}
        />

        {/* KnowledgeBase Sidebar */}
        <KnowledgeBaseSidebar
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          projectDocuments={data.documents}
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          onOpenDocument={handleOpenDocument}
          onUrlAdd={handleUrlAdd}
          projectSettings={data.settings}
          settingsError={null}
          settingsLoading={false}
          onUpdateSettings={handleDraftSettings}
          onApplySettings={handlePublishSettings}
        />
      </div>
      {selectedDocument && (
        <FileDetailsModal
          document={selectedDocument}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
    </>
  );
}


export default ProjectPage;
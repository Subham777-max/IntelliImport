import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../hooks/useCRM';
import { useToast } from '../../../global/hooks/useToast';
import AppLayout from '../../../global/components/AppLayout';
import Modal from '../../../global/components/Modal';
import EmptyState from '../../../global/components/EmptyState';
import { Btn, GhostBtn } from '../../../global/components/Buttons';

// ─── Project Card ────────────────────────────────────────────────────────────
const ProjectCard = ({ project, onOpen, onOpenDelete }) => {
    const date = project.createdAt
        ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    return (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow relative group">
            <div className="pr-6">
                <h3 className="text-sm font-semibold text-neutral-900 leading-tight truncate">{project.title}</h3>
                <p className="mt-0.5 text-[11px] text-neutral-400">Created {date}</p>
            </div>
            
            <button
                onClick={(e) => { e.stopPropagation(); onOpenDelete(project); }}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Project"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            <GhostBtn onClick={() => onOpen(project._id)} className="w-full justify-center mt-auto">
                Open Project →
            </GhostBtn>
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { projects, loading, error, handleGetProjects, handleCreateProject, handleDeleteProject } = useCRM();

    const [modalOpen, setModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [nameError, setNameError] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const hasFetched = useRef(false);

    // Fetch once on mount only
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        handleGetProjects();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (error) {
            showToast(error.response?.data?.message || error.message || 'Something went wrong', 'error');
        }
    }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

    const onCreateProject = async () => {
        if (!projectName.trim()) {
            setNameError('Project name is required');
            return;
        }
        const res = await handleCreateProject(projectName.trim());
        if (res?.project?._id) {
            showToast('Project created!', 'success');
            setModalOpen(false);
            setProjectName('');
            setNameError('');
            navigate(`/project/${res.project._id}`);
        }
    };

    const onModalClose = () => {
        setModalOpen(false);
        setProjectName('');
        setNameError('');
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        const res = await handleDeleteProject(projectToDelete._id);
        if (res?.success) {
            showToast('Project deleted successfully', 'success');
            setDeleteModalOpen(false);
            setProjectToDelete(null);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-sm font-semibold text-neutral-900">Projects</h1>
                        <p className="text-xs text-neutral-500 mt-0.5">Manage and track your lead import projects</p>
                    </div>
                    <Btn onClick={() => setModalOpen(true)}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </Btn>
                </div>

                {/* Loading skeletons */}
                {loading.projects ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-neutral-200 rounded-lg p-5 h-28 animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        }
                        title="No projects yet"
                        subtitle="Create your first project to start importing leads"
                        action={<Btn onClick={() => setModalOpen(true)}>Create Project</Btn>}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(p => (
                            <ProjectCard 
                                key={p._id} 
                                project={p} 
                                onOpen={(id) => navigate(`/project/${id}`)} 
                                onOpenDelete={(project) => { setProjectToDelete(project); setDeleteModalOpen(true); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={onModalClose}
                title="Create New Project"
                footer={
                    <>
                        <GhostBtn onClick={onModalClose}>Cancel</GhostBtn>
                        <Btn onClick={onCreateProject} loading={loading.createProject}>Create</Btn>
                    </>
                }
            >
                <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Project Name</label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={e => { setProjectName(e.target.value); setNameError(''); }}
                        onKeyDown={e => e.key === 'Enter' && onCreateProject()}
                        placeholder="e.g. Facebook Leads Q3"
                        autoFocus
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-neutral-900 placeholder-neutral-400 ${
                            nameError
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-neutral-200 focus:ring-black focus:border-black'
                        }`}
                    />
                    {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
                </div>
            </Modal>

            {/* Delete Project Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Project"
                footer={
                    <>
                        <GhostBtn onClick={() => setDeleteModalOpen(false)}>Cancel</GhostBtn>
                        <button
                            onClick={confirmDelete}
                            disabled={loading.deleteProject}
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {loading.deleteProject ? 'Deleting...' : 'Delete Project'}
                        </button>
                    </>
                }
            >
                <div className="text-sm text-neutral-600">
                    <p>Are you sure you want to delete <span className="font-semibold text-neutral-900">{projectToDelete?.title}</span>?</p>
                    <p className="mt-2 text-red-600 font-medium text-xs">This action cannot be undone. All imported records and skipped items will be permanently lost.</p>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default DashboardPage;

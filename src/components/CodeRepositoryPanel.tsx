"use client";
import { useState, useEffect } from "react";
import {
    Lock, Check, FileCode, Plus, Trash2, Copy,
    Search, Terminal, X, Maximize2, Minimize2,
    Sidebar, Play, RefreshCw, Layers, MoreHorizontal, Download, Sparkles
} from "lucide-react";
import { CodeFile } from "../types";
import { motion, AnimatePresence } from "framer-motion";

const CodeEditor = ({ repository, onUpdate, onClose, isFullScreen, toggleFullScreen }: any) => {
    const [files, setFiles] = useState<Record<string, CodeFile>>({});
    const [activeFile, setActiveFile] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [fileMenu, setFileMenu] = useState<string | null>(null);

    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        if (repository) {
            setFiles(repository);
            if (!activeFile && Object.keys(repository).length > 0) setActiveFile(Object.keys(repository)[0]);
        }

        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setShowSidebar(false);
        }
    }, [repository]);

    const [isRunning, setIsRunning] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false); 

    const handleRun = async () => {
        if (!activeFile) return;
        const file = files[activeFile];

        if (file.language === 'html' || file.name.endsWith('.html')) {
            setShowPreview(true);
            setConsoleOutput(null); 
            return;
        }

        if (file.language === 'python' || file.name.endsWith('.py')) {
            setIsRunning(true);
            setShowPreview(false);
            setConsoleOutput("Running..."); 

            try {
                const res = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: file.content, language: 'python' })
                });
                const data = await res.json();
                setConsoleOutput(data.output || data.error || "No Output");
            } catch (e: any) {
                setConsoleOutput(`Error: ${e.message}`);
            } finally {
                setIsRunning(false);
            }
            return;
        }

        alert("目前仅支持预览 HTML 或运行 Python 哦~");
    };

    const handleSave = () => {
        if (confirm("⚠️ Commit Changes to Repository?")) {
            onUpdate(files);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setFiles(repository || {});
        setIsEditing(false);
    };

    const handleNewFile = () => {
        const name = prompt("Filename (e.g. main.py):");
        if (name) {
            setFiles(prev => ({ ...prev, [name]: { name, language: "text", content: "# New File" } }));
            setActiveFile(name);
            setIsEditing(true);
            setShowSidebar(true); 
        }
    };

    const handleDelete = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setFileMenu(null);
        if (!window.confirm(`确认删除 ${name} 吗？删除后将从当前工程文件库移除。`)) return;
        const updated = { ...files };
        delete updated[name];
        setFiles(updated);
        onUpdate(updated);
        if (activeFile === name) setActiveFile(Object.keys(updated)[0] || "");
    };
    const handleDownload = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setFileMenu(null);
        const file = files[name];
        if (!file) return;
        const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name.split(/[\\/]/).pop() || "source.txt";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`bg-[#0b1125] flex flex-col text-[#cbd6f1] font-mono text-xs overflow-hidden shadow-[0_30px_100px_rgba(8,13,34,.48)] border-[#7788b6]/30 ${isFullScreen ? 'fixed inset-0 z-[100]' : 'w-full h-[min(80dvh,820px)] min-h-[550px] rounded-2xl border'}`}>

            <div className="bg-[linear-gradient(110deg,#162546,#242343_65%,#322b4c)] px-4 py-3 border-b border-[#7d83b5]/25 flex justify-between items-center select-none shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-1 rounded hover:bg-white/10 ${showSidebar ? 'text-blue-400' : 'text-slate-500'}`}
                        title="Toggle Sidebar"
                    >
                        <Sidebar size={14} />
                    </button>

                    <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Sparkles size={14} className="text-[#a6b9fc]" />
                        <span className="hidden md:inline">OFFICINA IDE</span>
                        <span className="md:hidden text-[#a6b9fc] truncate max-w-[100px]">{activeFile}</span>
                    </div>
                </div>

                <div className="flex gap-2 items-center">

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`p-1.5 rounded transition-colors ${isRunning ? 'text-[#a6b9fc] bg-[#39476b]' : 'hover:bg-white/10 text-[#a6b9fc]'}`}
                        title="Run Code"
                    >
                        {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    </button>

                    <div className="w-px h-4 bg-gray-600 mx-1"></div>

                    {isEditing && (
                        <button onClick={handleCancel} className="p-1.5 hover:bg-white/10 rounded text-red-400" title="Discard">
                            <X size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-[#394c7d]/60 text-[#c7d4ff] animate-pulse' : 'hover:bg-white/10 text-slate-400'}`}
                        title={isEditing ? "Commit" : "Edit"}
                    >
                        {isEditing ? <Check size={14} /> : <Lock size={14} />}
                    </button>

                    <button onClick={handleNewFile} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="New File"><Plus size={14} /></button>
                    <button onClick={toggleFullScreen} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Fullscreen">
                        {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-900/50 rounded text-slate-300 hover:text-red-400" title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {showSidebar && (
                    <div className="w-1/3 md:w-56 bg-[#121c36] border-r border-[#879bcc]/20 flex flex-col absolute inset-y-0 left-0 z-10 md:static">
                        <div className="p-2 border-b border-[#879bcc]/20">
                            <div className="relative">
                                <Search size={10} className="absolute left-2 top-1.5 text-slate-500" />
                                <input className="w-full bg-[#1d2b4c] border border-[#6579a4]/30 rounded-lg px-6 py-1 outline-none text-slate-200 placeholder-slate-500" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                            {Object.keys(files).filter(f => f.toLowerCase().includes(searchTerm.toLowerCase())).map(fileName => (
                                <div
                                    key={fileName}
                                    onClick={() => { setActiveFile(fileName); setFileMenu(null); if (window.innerWidth < 768) setShowSidebar(false); }} // 手机上选完文件自动收起
                                    className={`flex justify-between items-center px-2 py-1.5 rounded cursor-pointer group ${activeFile === fileName ? 'bg-[#34476e] text-white' : 'hover:bg-[#253557]'}`}
                                >
                                    <span className="flex items-center gap-2 truncate text-[11px]">
                                        <FileCode size={12} className="text-blue-400 flex-shrink-0" />
                                        <span className="truncate">{fileName}</span>
                                    </span>
                                    <div className="relative shrink-0">
                                        <button type="button" onClick={e => { e.stopPropagation(); setFileMenu(fileMenu === fileName ? null : fileName); }}
                                            className="rounded-md p-1 text-[#a8b7d8] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/10"
                                            aria-label={`文件操作：${fileName}`} aria-expanded={fileMenu === fileName}>
                                            <MoreHorizontal size={15}/>
                                        </button>
                                        {fileMenu === fileName && <div className="absolute right-0 top-full z-40 mt-1 w-32 rounded-xl border border-[#52678e]/60 bg-[#202f52] p-1 text-[11px] shadow-2xl">
                                            <button type="button" onClick={e => handleDownload(e, fileName)}
                                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/10">
                                                <Download size={13}/> 下载
                                            </button>
                                            <button type="button" onClick={e => handleDelete(e, fileName)}
                                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[#ffb2c0] hover:bg-[#ad4767]/20">
                                                <Trash2 size={13}/> 删除
                                            </button>
                                        </div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`flex-1 flex flex-col bg-[#0e1730] relative transition-all ${showSidebar ? 'ml-[33.33%] md:ml-0' : 'ml-0'}`}>

                    {activeFile ? (
                        <div className="relative flex-1 min-h-0 flex flex-col h-full">

                            <div
                                className="absolute top-2 right-4 z-10 opacity-30 hover:opacity-100 cursor-pointer transition-opacity p-1 bg-black/50 rounded"
                                onClick={() => { navigator.clipboard.writeText(files[activeFile].content); alert("Copied!"); }}
                                title="Copy Content"
                            >
                                <Copy size={14} />
                            </div>

                            <textarea
                                value={files[activeFile]?.content || ""}
                                onChange={(e) => setFiles({ ...files, [activeFile]: { ...files[activeFile], content: e.target.value } })}
                                disabled={!isEditing}
                                spellCheck={false}
                                className={`w-full flex-1 bg-transparent p-4 outline-none resize-none font-mono leading-relaxed ${isEditing ? 'text-white' : 'text-slate-400'}`}
                                style={{ fontFamily: '"Fira Code", "Consolas", monospace', fontSize: isFullScreen ? '14px' : '12px' }}
                            />

                            <AnimatePresence>
                                {(consoleOutput !== null || showPreview) && (
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: "40%" }} exit={{ height: 0 }}
                                        className="border-t border-slate-700 bg-[#080e20] flex flex-col shrink-0"
                                    >
                                        <div className="flex justify-between items-center px-4 py-1 bg-[#1c2949] border-b border-[#879bcc]/20">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                                                <Layers size={12} /> {showPreview ? "Web Preview" : "Console Output"}
                                            </span>
                                            <button onClick={() => { setConsoleOutput(null); setShowPreview(false) }} className="text-gray-500 hover:text-white transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-auto relative p-0">
                                            {showPreview && files[activeFile] ? (
                                                <iframe
                                                    srcDoc={files[activeFile].content}
                                                    className="w-full h-full bg-white"
                                                    sandbox="allow-scripts" 
                                                    title="preview"
                                                />
                                            ) : (
                                                <pre className="p-4 text-xs font-mono text-[#adbbec] whitespace-pre-wrap select-text font-bold">
                                                    {consoleOutput}
                                                </pre>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-2 select-none">
                            <Terminal size={32} className="opacity-20" />
                            <span>No File Selected</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CodeRepositoryModal = ({ isOpen, onClose, repository, onUpdate }: any) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[80] bg-[#080e22]/75 backdrop-blur-[8px] flex items-center justify-center ${isFullScreen ? 'p-0' : 'p-3 md:p-6'}`}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className={isFullScreen ? "w-full h-full" : "w-full max-w-[960px]"}
                    >
                        <CodeEditor
                            repository={repository}
                            onUpdate={onUpdate}
                            onClose={onClose}
                            isFullScreen={isFullScreen}
                            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
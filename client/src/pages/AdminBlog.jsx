import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    content: "",
    mediaFile: null,
    mediaURL: "",
    type: "image",
    author: "",
    location: "",
  });
  const [editingPostId, setEditingPostId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [modalPost, setModalPost] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/blog");
      setPosts(response.data.sort((a,b) => a.order - b.order));
    } catch (err) { console.error(err); setError("Failed to load posts."); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => setNewPost({ ...newPost, [e.target.name]: e.target.value });
  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    setNewPost({ ...newPost, mediaFile: file, mediaURL: URL.createObjectURL(file), type });
  };

  const handleCreatePost = async () => {
    try {
      const formData = new FormData();
      formData.append("title", newPost.title);
      formData.append("excerpt", newPost.excerpt);
      formData.append("content", newPost.content);
      formData.append("author", newPost.author);
      formData.append("location", newPost.location);
      formData.append("type", newPost.type);
      formData.append("order", posts.length ? Math.max(...posts.map(p=>p.order))+1 : 1);
      if (newPost.mediaFile) formData.append("mediaFile", newPost.mediaFile);
      await axios.post("/api/blog", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setNewPost({ title:"", excerpt:"", content:"", mediaFile:null, mediaURL:"", type:"image", author:"", location:"" });
      fetchPosts();
    } catch (err) { console.error(err); alert("Failed to create post"); }
  };

  const startEditing = (post) => { setEditingPostId(post.id); setEditFields({ ...post, mediaFile:null, mediaURL:post.media }); };
  const cancelEditing = () => { setEditingPostId(null); setEditFields({}); };
  const handleEditInputChange = (e) => setEditFields({ ...editFields, [e.target.name]: e.target.value });
  const handleEditFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    setEditFields({ ...editFields, mediaFile: file, mediaURL: URL.createObjectURL(file), type });
  };

  const saveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append("title", editFields.title);
      formData.append("excerpt", editFields.excerpt);
      formData.append("content", editFields.content);
      formData.append("author", editFields.author);
      formData.append("location", editFields.location);
      formData.append("type", editFields.type);
      if (editFields.mediaFile) formData.append("mediaFile", editFields.mediaFile);
      await axios.put(`/api/blog/${editingPostId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      cancelEditing(); fetchPosts();
    } catch (err) { console.error(err); alert("Failed to save changes"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try { await axios.delete(`/api/blog/${id}`); fetchPosts(); } catch(err){ console.error(err); alert("Failed to delete post"); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reorderedPosts = Array.from(posts);
    const [moved] = reorderedPosts.splice(result.source.index,1);
    reorderedPosts.splice(result.destination.index,0,moved);
    const updatedPosts = reorderedPosts.map((post,index)=>({ ...post, order:index+1 }));
    setPosts(updatedPosts);
    try { await Promise.all(updatedPosts.map(p=>axios.put(`/api/blog/${p.id}`,{order:p.order}))); } catch(err){ console.error("Failed to update post order",err); }
  };

  const renderMedia = (post, clickable=true) => {
    if (!post.mediaURL) return null;
    if (post.type==="image") return <img src={post.mediaURL} alt={post.title} className="w-full max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-80" onClick={()=>clickable&&setModalPost(post)} />;
    return <video src={post.mediaURL} autoPlay muted loop controls className="w-full max-h-64 object-cover rounded-xl bg-black cursor-pointer hover:opacity-80" onClick={()=>clickable&&setModalPost(post)} />;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-6">Manage Blog & Testimonials</h1>

      {/* New Post Form */}
      <Card className="mb-8 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
        <CardHeader><CardTitle className="text-xl font-bold text-green-600 dark:text-green-400">Create New Post</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <input type="text" name="title" placeholder="Title" value={newPost.title} onChange={handleInputChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" />
          <input type="text" name="excerpt" placeholder="Excerpt" value={newPost.excerpt} onChange={handleInputChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" />
          <textarea name="content" placeholder="Content" value={newPost.content} onChange={handleInputChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" rows={5} />
          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" />
          {newPost.mediaURL && renderMedia(newPost)}
          <input type="text" name="author" placeholder="Author" value={newPost.author} onChange={handleInputChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" />
          <input type="text" name="location" placeholder="Location" value={newPost.location} onChange={handleInputChange} className="w-full p-2 border rounded-xl dark:bg-gray-700" />
          <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md" onClick={handleCreatePost}>Create Post</Button>
        </CardContent>
      </Card>

      {/* Existing Posts */}
      {loading ? <p>Loading posts...</p> : error ? <p className="text-red-500">{error}</p> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="posts" direction="vertical">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {posts.map((post,index)=>(
                  <Draggable key={post.id} draggableId={post.id} index={index}>
                    {(provided)=>(
                      <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="rounded-2xl shadow-md hover:shadow-xl transition relative group">
                        <CardContent className="p-4 flex flex-col">
                          {editingPostId===post.id ? (
                            <>
                              <input type="text" name="title" value={editFields.title} onChange={handleEditInputChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" />
                              <input type="text" name="excerpt" value={editFields.excerpt} onChange={handleEditInputChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" />
                              <textarea name="content" value={editFields.content} onChange={handleEditInputChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" rows={4} />
                              <input type="file" accept="image/*,video/*" onChange={handleEditFileChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" />
                              <input type="text" name="author" value={editFields.author} onChange={handleEditInputChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" />
                              <input type="text" name="location" value={editFields.location} onChange={handleEditInputChange} className="w-full p-2 border rounded-xl mb-2 dark:bg-gray-700" />
                              <div className="flex gap-2 mt-2">
                                <Button className="bg-green-500 hover:bg-green-600 text-white flex-1 rounded-xl" onClick={saveEdit}>Save</Button>
                                <Button className="bg-gray-500 hover:bg-gray-600 text-white flex-1 rounded-xl" onClick={cancelEditing}>Cancel</Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="font-bold text-lg text-green-600 dark:text-green-400">{post.title}</h3>
                              {renderMedia(post)}
                              <div className="flex gap-2 mt-4">
                                <Button className="bg-blue-500 hover:bg-blue-600 text-white flex-1 rounded-xl" onClick={()=>startEditing(post)}>Edit</Button>
                                <Button className="bg-red-500 hover:bg-red-600 text-white flex-1 rounded-xl" onClick={()=>handleDelete(post.id)}>Delete</Button>
                              </div>

                              {/* Cute Hover Quick View Card */}
                              <div className="absolute top-2 left-2 w-64 p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                                  <p className="text-gray-900 dark:text-gray-100 text-sm mb-1 relative z-10 font-semibold">{post.excerpt}</p>
                                  <p className="text-gray-700 dark:text-gray-300 text-xs mb-1 relative z-10">{post.author} - {post.location}</p>
                                  {post.type === "image" ? (
                                    <img src={post.mediaURL} alt={post.title} className="w-full max-h-24 object-cover rounded-lg relative z-10" />
                                  ) : (
                                    <video src={post.mediaURL} className="w-full max-h-24 object-cover rounded-lg relative z-10" muted />
                                  )}
                                  <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 z-20">
                                    <span className="text-white dark:text-gray-200 font-semibold text-sm">Click to view full post</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Full Modal */}
      {modalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={()=>setModalPost(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-2xl w-full relative" onClick={e=>e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{modalPost.title}</h2>
            <p className="mb-4">{modalPost.content}</p>
            {renderMedia(modalPost,false)}
            <p className="mt-2 text-gray-500 dark:text-gray-400">{modalPost.author} - {modalPost.location}</p>
            <Button className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-xl" onClick={()=>setModalPost(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

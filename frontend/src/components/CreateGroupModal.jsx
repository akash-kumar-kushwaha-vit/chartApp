import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Camera, Loader2, Check } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const { users, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Filter out any groups from the select list
  const contactList = users.filter(u => !u.isGroup);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedMembers.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("members", JSON.stringify(selectedMembers));

      if (imageFile) {
        formData.append("avtar", imageFile);
      }

      const newGroup = await createGroup(formData);
      onClose(newGroup);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Group</h2>
          <button onClick={() => onClose(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className={`w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center overflow-hidden transition-all ${!imagePreview && 'bg-gray-100 dark:bg-gray-800'}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Subject</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your group"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Group description"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400"
                maxLength={100}
              />
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add Members</label>
              <span className="text-xs text-indigo-500 font-medium">{selectedMembers.length} selected</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700">
              {contactList.length === 0 ? (
                <p className="text-sm text-center text-gray-500 py-4">You don't have any contacts to add.</p>
              ) : (
                contactList.map(contact => (
                  <div
                    key={contact._id}
                    onClick={() => toggleMember(contact._id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="w-5 h-5 flex flex-shrink-0 items-center justify-center border-2 border-indigo-500 rounded text-transparent transition-all">
                      {selectedMembers.includes(contact._id) && (
                        <div className="w-full h-full bg-indigo-500 border-indigo-500 flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {contact.avtar ? (
                      <img src={contact.avtar} alt={contact.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{contact.fullName[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button
            onClick={handleCreateGroup}
            disabled={!name.trim() || selectedMembers.length === 0 || isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Group"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateGroupModal;

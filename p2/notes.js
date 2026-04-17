document.addEventListener('DOMContentLoaded', () => {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const quickNoteModal = document.getElementById('quickNoteModal');
    const closeNoteModalBtn = document.getElementById('closeNoteModalBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const noteForm = document.getElementById('noteForm');
    const notesGrid = document.getElementById('notesGrid');
    const noNotesMessage = document.getElementById('noNotesMessage');
    const noteModalTitle = document.getElementById('noteModalTitle');

    let notes = [];

    init();

    function init() {
        const storedNotes = localStorage.getItem('leadFlow_notes');
        if (storedNotes) {
            notes = JSON.parse(storedNotes);
        }
        renderNotes();
    }

    addNoteBtn.addEventListener('click', () => openModal());
    closeNoteModalBtn.addEventListener('click', closeModal);
    cancelNoteBtn.addEventListener('click', closeModal);
    noteForm.addEventListener('submit', handleFormSubmit);

    window.addEventListener('click', (e) => {
        if (e.target === quickNoteModal) {
            closeModal();
        }
    });

    function openModal(noteId = null) {
        noteForm.reset();
        document.getElementById('noteId').value = '';
        noteModalTitle.textContent = 'Add New Note';

        if (noteId) {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                document.getElementById('noteId').value = note.id;
                document.getElementById('noteTitle').value = note.title;
                document.getElementById('noteContent').value = note.content;
                noteModalTitle.textContent = 'Edit Note';
            }
        }
        quickNoteModal.classList.add('active');
    }

    function closeModal() {
        quickNoteModal.classList.remove('active');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('noteId').value;
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (id) {
            const index = notes.findIndex(n => n.id === id);
            if (index !== -1) {
                notes[index] = { ...notes[index], title, content, updatedAt: new Date().toISOString() };
            }
        } else {
            notes.push({
                id: Date.now().toString(),
                title,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        saveData();
        renderNotes();
        closeModal();
    }

    function saveData() {
        localStorage.setItem('leadFlow_notes', JSON.stringify(notes));
    }

    window.deleteNote = function(id) {
        if(confirm("Are you sure you want to delete this note?")) {
            notes = notes.filter(n => n.id !== id);
            saveData();
            renderNotes();
        }
    };

    window.editNote = function(id) {
        openModal(id);
    };

    function renderNotes() {
        notesGrid.innerHTML = '';

        if (notes.length === 0) {
            noNotesMessage.classList.remove('hidden');
            notesGrid.classList.add('hidden');
        } else {
            noNotesMessage.classList.add('hidden');
            notesGrid.classList.remove('hidden');

            notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(note => {
                const date = new Date(note.updatedAt).toLocaleDateString();
                const card = document.createElement('div');
                card.className = 'note-card';
                card.innerHTML = `
                    <div class="note-card-header">
                        <h3>${note.title}</h3>
                        <div class="note-actions">
                            <button onclick="editNote('${note.id}')" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                            <button onclick="deleteNote('${note.id}')" title="Delete" class="delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="note-card-body">
                        <p>${note.content}</p>
                    </div>
                    <div class="note-card-footer">
                        <span><i class="fa-regular fa-clock"></i> ${date}</span>
                    </div>
                `;
                notesGrid.appendChild(card);
            });
        }
    }
});

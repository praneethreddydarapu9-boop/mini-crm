document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const addLeadBtn = document.getElementById('addLeadBtn');
    const leadModal = document.getElementById('leadModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const leadForm = document.getElementById('leadForm');
    
    const notesModal = document.getElementById('notesModal');
    const closeNotesBtn = document.getElementById('closeNotesBtn');
    const notesBody = document.getElementById('notesBody');
    
    const leadsTableBody = document.getElementById('leadsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const modalTitle = document.getElementById('modalTitle');
    
    const statNew = document.getElementById('statNew');
    const statContacted = document.getElementById('statContacted');
    const statConverted = document.getElementById('statConverted');

    // --- State ---
    let leads = [];

    // --- Initialization ---
    init();

    function init() {
        const storedLeads = localStorage.getItem('leadFlow_leads');
        if (storedLeads) {
            leads = JSON.parse(storedLeads);
        }
        renderLeads();
        updateStats();
    }

    // --- Event Listeners ---
    addLeadBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    leadForm.addEventListener('submit', handleFormSubmit);

    closeNotesBtn.addEventListener('click', closeNotesModal);

    searchInput.addEventListener('input', () => renderLeads());
    statusFilter.addEventListener('change', () => renderLeads());

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === leadModal) {
            closeModal();
        }
        if (e.target === notesModal) {
            closeNotesModal();
        }
    });

    // --- Modal Functions ---
    function openModal(leadId = null) {
        leadForm.reset();
        document.getElementById('leadId').value = '';
        modalTitle.textContent = 'Add New Lead';

        if (leadId) {
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                document.getElementById('leadId').value = lead.id;
                document.getElementById('leadName').value = lead.name;
                document.getElementById('leadEmail').value = lead.email;
                document.getElementById('leadSource').value = lead.source;
                document.getElementById('leadStatus').value = lead.status;
                document.getElementById('leadFollowup').value = lead.followup || '';
                document.getElementById('leadNotes').value = lead.notes || '';
                modalTitle.textContent = 'Edit Lead';
            }
        }
        leadModal.classList.add('active');
    }

    function closeModal() {
        leadModal.classList.remove('active');
    }

    function openNotesModal(notes) {
        notesBody.textContent = notes || 'No notes available for this lead.';
        notesModal.classList.add('active');
    }

    function closeNotesModal() {
        notesModal.classList.remove('active');
    }

    // --- Form Handling ---
    function handleFormSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('leadId').value;
        const name = document.getElementById('leadName').value.trim();
        const email = document.getElementById('leadEmail').value.trim();
        const source = document.getElementById('leadSource').value;
        const status = document.getElementById('leadStatus').value;
        const followup = document.getElementById('leadFollowup').value;
        const notes = document.getElementById('leadNotes').value.trim();

        if (id) {
            // Edit existing
            const index = leads.findIndex(l => l.id === id);
            if (index !== -1) {
                leads[index] = { ...leads[index], name, email, source, status, followup, notes };
            }
        } else {
            // Add new
            const newLead = {
                id: Date.now().toString(),
                name,
                email,
                source,
                status,
                followup,
                notes,
                createdAt: new Date().toISOString()
            };
            leads.push(newLead);
        }

        saveData();
        renderLeads();
        updateStats();
        closeModal();
    }

    // --- Data Management ---
    function saveData() {
        localStorage.setItem('leadFlow_leads', JSON.stringify(leads));
    }

    window.deleteLead = function(id) {
        if(confirm("Are you sure you want to delete this lead?")) {
            leads = leads.filter(l => l.id !== id);
            saveData();
            renderLeads();
            updateStats();
        }
    };

    window.editLead = function(id) {
        openModal(id);
    };

    window.viewNotes = function(id) {
        const lead = leads.find(l => l.id === id);
        if (lead) {
            openNotesModal(lead.notes);
        }
    };

    window.updateStatus = function(id, selectElement) {
        const newStatus = selectElement.value;
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].status = newStatus;
            saveData();
            updateStats();
            // Re-render completely if it affects current filter
            // Otherwise just update the badge next to it, but simpler to just re-render
            renderLeads();
        }
    }

    // --- Rendering ---
    function renderLeads() {
        leadsTableBody.innerHTML = '';
        
        const searchTerm = searchInput.value.toLowerCase();
        const filterStatus = statusFilter.value;

        const filteredLeads = leads.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchTerm) || lead.email.toLowerCase().includes(searchTerm);
            const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

        if (filteredLeads.length === 0) {
            noDataMessage.classList.remove('hidden');
            leadsTableBody.parentElement.classList.add('hidden');
        } else {
            noDataMessage.classList.add('hidden');
            leadsTableBody.parentElement.classList.remove('hidden');
            
            filteredLeads.forEach(lead => {
                const tr = document.createElement('tr');
                
                // Format Date helper
                const formattedDate = lead.followup ? new Date(lead.followup).toLocaleDateString() : '-';

                tr.innerHTML = `
                    <td>
                        <strong>${lead.name}</strong>
                    </td>
                    <td class="td-contact">
                        <div class="email">${lead.email}</div>
                    </td>
                    <td>${lead.source}</td>
                    <td>
                        <select class="status-select ${lead.status.toLowerCase()}-text" onchange="updateStatus('${lead.id}', this)">
                            <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="Converted" ${lead.status === 'Converted' ? 'selected' : ''}>Converted</option>
                        </select>
                    </td>
                    <td>${formattedDate}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn notes" onclick="viewNotes('${lead.id}')" title="View Notes"><i class="fa-solid fa-file-lines"></i></button>
                            <button class="action-btn" onclick="editLead('${lead.id}')" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                            <button class="action-btn delete" onclick="deleteLead('${lead.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                leadsTableBody.appendChild(tr);
            });
        }
    }

    function updateStats() {
        const newCount = leads.filter(l => l.status === 'New').length;
        const contactedCount = leads.filter(l => l.status === 'Contacted').length;
        const convertedCount = leads.filter(l => l.status === 'Converted').length;

        statNew.textContent = newCount;
        statContacted.textContent = contactedCount;
        statConverted.textContent = convertedCount;
    }
});

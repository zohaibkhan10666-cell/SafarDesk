import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  User, 
  Filter, 
  X,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { initialUsers } from '../data/mockData';

export default function TasksView({ tasks, setTasks, onOpenWhatsApp }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newPhone, setNewPhone] = useState('+92');
  const [newCategory, setNewCategory] = useState('Payment Follow-up');
  const [newDueDate, setNewDueDate] = useState('Today, 05:00 PM');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newAssignedTo, setNewAssignedTo] = useState('Hamza Tariq');

  const filteredTasks = tasks.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(q) || 
                          t.customerName.toLowerCase().includes(q) || 
                          t.assignedTo.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'TODAY') return t.status === 'PENDING' && t.dueDate.toLowerCase().includes('today');
    if (activeTab === 'OVERDUE') return t.status === 'OVERDUE' || t.dueDate.toLowerCase().includes('overdue');
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED';
    if (activeTab === 'UPCOMING') return t.status === 'PENDING' && !t.dueDate.toLowerCase().includes('today') && !t.dueDate.toLowerCase().includes('overdue');
    return true;
  });

  const handleMarkCompleted = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t));
  };

  const handleSnooze = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate: 'Tomorrow, 11:00 AM', status: 'PENDING' } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle || !newCustomer) return;

    const newTask = {
      id: `TSK-${Date.now()}`,
      title: newTitle,
      customerName: newCustomer,
      phone: newPhone,
      category: newCategory,
      dueDate: newDueDate,
      priority: newPriority,
      status: 'PENDING',
      assignedTo: newAssignedTo,
      branchId: 'b-lhr',
      relatedRef: 'TASK-MANUAL'
    };

    setTasks([newTask, ...tasks]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewCustomer('');
    setNewPhone('+92');
  };

  const handleDirectWhatsApp = (task) => {
    const cleanPhone = task.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Assalam-o-Alaikum ${task.customerName},\nThis is SafarDesk Travel regarding your trip enquiry/booking: ${task.title}. Please let us know when is a convenient time to speak.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const countToday = tasks.filter(t => t.status === 'PENDING' && t.dueDate.toLowerCase().includes('today')).length;
  const countOverdue = tasks.filter(t => t.status === 'OVERDUE' || t.dueDate.toLowerCase().includes('overdue')).length;
  const countCompleted = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Tasks & Follow-up Action Center
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §19
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Daily consultant call queues, overdue payment collections, document follow-ups, and WhatsApp alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Follow-up Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sd-card p-4 flex items-center justify-between">
          <div>
            <span className="mono-eyebrow text-[10px] text-[var(--amber)]">Due Today</span>
            <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1">{countToday} Calls & Actions</div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">Requires consultant outreach</div>
          </div>
          <Clock className="w-8 h-8 text-[var(--amber)] opacity-60" />
        </div>

        <div className="sd-card p-4 flex items-center justify-between">
          <div>
            <span className="mono-eyebrow text-[10px] text-[var(--red)]">Overdue Tasks</span>
            <div className="text-2xl font-bold font-mono text-[var(--red)] mt-1">{countOverdue} Critical</div>
            <div className="text-[11px] text-[var(--red)] font-medium mt-0.5">Past scheduled deadline</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-[var(--red)] opacity-60" />
        </div>

        <div className="sd-card p-4 flex items-center justify-between">
          <div>
            <span className="mono-eyebrow text-[10px] text-[var(--mint)]">Completed Tasks</span>
            <div className="text-2xl font-bold font-mono text-[var(--mint)] mt-1">{countCompleted} Archived</div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">Resolved by sales & visa staff</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-[var(--mint)] opacity-60" />
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'TODAY', label: `Due Today (${countToday})` },
            { id: 'OVERDUE', label: `Overdue (${countOverdue})` },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: `Completed (${countCompleted})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, consultant, task..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="sd-card divide-y divide-[var(--line)] overflow-hidden">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = task.status === 'OVERDUE' || task.dueDate.toLowerCase().includes('overdue');

            return (
              <div 
                key={task.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-2)] transition-colors ${
                  isCompleted ? 'opacity-50 bg-[var(--surface-2)]/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleMarkCompleted(task.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isCompleted 
                        ? 'bg-[var(--mint)] text-black' 
                        : 'border border-[var(--line-2)] hover:border-[var(--mint)] text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${isCompleted ? 'line-through text-[var(--text-3)]' : 'text-[var(--text)]'}`}>
                        {task.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        task.priority === 'URGENT' ? 'bg-[var(--red-dim)] text-[var(--red)] border border-[rgba(240,74,90,0.3)]' :
                        task.priority === 'HIGH' ? 'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]' :
                        'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="mono-eyebrow text-[9px] text-[var(--cyan)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
                        {task.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--text-2)] font-body flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[var(--text-3)]" />
                        <span className="text-[var(--text)] font-medium">{task.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-3)]">
                        <Phone className="w-3 h-3" />
                        <span>{task.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--mint)]">
                        <span>Assigned: <strong>{task.assignedTo}</strong></span>
                      </div>
                      <div className={`flex items-center gap-1 font-mono text-[11px] ${
                        isOverdue ? 'text-[var(--red)] font-bold' : 'text-[var(--amber)]'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDirectWhatsApp(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] text-black hover:bg-[#20ba59] transition-all shadow-xs"
                    title="Send WhatsApp Follow-up"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleSnooze(task.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors flex items-center gap-1"
                    title="Reschedule to Tomorrow"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Snooze</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-[var(--text-3)]">
            No tasks found in this view. Great job! All follow-ups are up to date.
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div 
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">Schedule Follow-up Task</h2>
                <p className="text-xs text-[var(--text-3)] font-body">Assign a reminder to consultant or operations staff</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs font-body">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Task Description</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Call client to collect remaining installment payment"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="Chaudhry Kamran Akram"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">WhatsApp / Phone</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  >
                    <option value="Payment Follow-up">Payment Follow-up</option>
                    <option value="Document Verification">Document Verification</option>
                    <option value="Visa Consultation">Visa Consultation</option>
                    <option value="Supplier Coordination">Supplier Coordination</option>
                    <option value="Voucher Issuance">Voucher Issuance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Assigned Staff</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  >
                    {initialUsers.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Due Deadline</label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="Today, 03:00 PM or 2026-09-24"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-pill px-5 py-2 text-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

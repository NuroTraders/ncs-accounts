/* ---------- 06b-tasks: Task Schedule & Project Tracking Module ---------- */

const TASK_STAGES = [
  { id: 'pending', en: 'Pending', bn: 'অমীমাংসিত', color: 'var(--warn)', bg: 'rgba(217,119,6,0.12)', icon: '⏳' },
  { id: 'in-progress', en: 'In Progress', bn: 'চলমান', color: 'var(--acc)', bg: 'var(--soft)', icon: '⚡' },
  { id: 'review', en: 'Under Review', bn: 'পর্যালোচনায়', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: '🔍' },
  { id: 'complete', en: 'Completed', bn: 'সম্পন্ন', color: 'var(--pos)', bg: 'rgba(21,128,61,0.12)', icon: '✅' },
  { id: 'cancelled', en: 'Cancelled', bn: 'বাতিল', color: 'var(--neg)', bg: 'rgba(220,38,38,0.12)', icon: '✕' }
];

const TASK_PRIORITIES = [
  { id: 'low', en: 'Low', bn: 'কম', color: 'var(--mut)', bg: 'rgba(100,116,139,0.12)' },
  { id: 'medium', en: 'Medium', bn: 'মাঝারি', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  { id: 'high', en: 'High', bn: 'বেশি', color: 'var(--warn)', bg: 'rgba(245,158,11,0.12)' },
  { id: 'urgent', en: 'Urgent', bn: 'জরুরি', color: 'var(--neg)', bg: 'rgba(239,68,68,0.16)' }
];

let TSK_VIEW = 'board'; // 'board' or 'list'
let TSK_STAGE = 'active'; // 'active' (excludes complete & cancelled) or stage id or 'all'
let TSK_PRIORITY = '';
let TSK_ASSIGNEE = '';
let TSK_Q = '';
let TSK_SORT = 'deadline'; // 'deadline', 'priority', 'newest', 'progress'

function stageInfo(id){
  return TASK_STAGES.find(s=>s.id===id)||TASK_STAGES[0];
}

function priorityInfo(id){
  return TASK_PRIORITIES.find(p=>p.id===id)||TASK_PRIORITIES[1];
}

function taskOverdue(t){
  if(!t.deadline||t.stage==='complete'||t.stage==='cancelled') return false;
  return t.deadline < todayIso();
}

function taskDeadlineBadge(t){
  if(t.stage==='complete'){
    return '<span class="t-badge t-badge-done">✓ '+(t.completed?sd(t.completed):lb('Done','সম্পন্ন'))+'</span>';
  }
  if(!t.deadline) return '';
  const today = todayIso();
  if(t.deadline < today){
    const diff = Math.round((new Date(today+'T00:00:00') - new Date(t.deadline+'T00:00:00'))/(1000*60*60*24));
    return '<span class="t-badge t-badge-overdue" title="'+lb('Deadline passed','সময় পার হয়েছে')+'">⚠️ '+diff+' '+lb('d overdue','দিন পার')+'</span>';
  }
  if(t.deadline === today){
    return '<span class="t-badge t-badge-today">🔔 '+lb('Due Today','আজ শেষ দিন')+'</span>';
  }
  const daysLeft = Math.round((new Date(t.deadline+'T00:00:00') - new Date(today+'T00:00:00'))/(1000*60*60*24));
  return '<span class="t-badge t-badge-left">⏳ '+daysLeft+' '+lb('d left','দিন বাকি')+'</span>';
}

function getAllAssignees(){
  var list = ['Admin'];
  if(S.users && Array.isArray(S.users)){
    S.users.forEach(function(u){
      if(u.name && !list.includes(u.name)) list.push(u.name);
    });
  }
  if(U && U.name && !list.includes(U.name)) list.push(U.name);
  return list;
}

function getFilteredTasks(){
  if(!Array.isArray(S.tasks)) S.tasks = [];
  var list = S.tasks.filter(t => !t.removed);
  
  if(TSK_STAGE === 'active'){
    list = list.filter(t => t.stage !== 'complete' && t.stage !== 'cancelled');
  } else if(TSK_STAGE && TSK_STAGE !== 'all'){
    list = list.filter(t => t.stage === TSK_STAGE);
  }
  
  if(TSK_PRIORITY){
    list = list.filter(t => t.priority === TSK_PRIORITY);
  }
  
  if(TSK_ASSIGNEE){
    list = list.filter(t => t.assignee === TSK_ASSIGNEE);
  }
  
  if(TSK_Q){
    var q = TSK_Q.trim().toLowerCase();
    list = list.filter(t => 
      (t.title||'').toLowerCase().includes(q) ||
      (t.desc||'').toLowerCase().includes(q) ||
      (t.assignee||'').toLowerCase().includes(q) ||
      (Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  list.sort((a,b)=>{
    if(TSK_SORT === 'deadline'){
      var da = a.deadline || '9999-99-99', db = b.deadline || '9999-99-99';
      return da.localeCompare(db);
    }
    if(TSK_SORT === 'priority'){
      var pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (pOrder[b.priority]||0) - (pOrder[a.priority]||0);
    }
    if(TSK_SORT === 'progress'){
      return (b.progress||0) - (a.progress||0);
    }
    return (b.u||0) - (a.u||0); // newest
  });
  
  return list;
}

function taskUI(){
  if(!U) return;
  var v = $('vTask');
  if(!v) return;
  
  if(!Array.isArray(S.tasks)) S.tasks = [];
  var all = S.tasks.filter(t => !t.removed);
  var totalCount = all.length;
  var pendingCount = all.filter(t => t.stage === 'pending').length;
  var inProgCount = all.filter(t => t.stage === 'in-progress').length;
  var reviewCount = all.filter(t => t.stage === 'review').length;
  var doneCount = all.filter(t => t.stage === 'complete').length;
  var overdueCount = all.filter(t => taskOverdue(t)).length;
  
  var filtered = getFilteredTasks();
  var assignees = getAllAssignees();
  
  var html = '' +
  '<header class="task-hdr">' +
    '<div>' +
      '<div class="shop">' + lb('Workflow & Task Management', 'কাজের অগ্রগতি ও সময়সূচী') + '</div>' +
      '<h1 style="display:flex;align-items:center;gap:10px">' +
        '<span>' + lb('Task Schedule', 'কাজের সময়সূচী') + '</span>' +
        (overdueCount > 0 ? '<span class="t-badge t-badge-overdue" style="font-size:12px">⚠️ ' + overdueCount + ' ' + lb('Overdue', 'সময় পার') + '</span>' : '') +
      '</h1>' +
    '</div>' +
    '<div class="nav" style="display:flex;gap:8px;align-items:center">' +
      '<div class="seg" id="taskViewSeg">' +
        '<button type="button" data-tv="board" class="' + (TSK_VIEW==='board'?'on':'') + '">🗂️ ' + lb('Board', 'বোর্ড') + '</button>' +
        '<button type="button" data-tv="list" class="' + (TSK_VIEW==='list'?'on':'') + '">📋 ' + lb('List', 'তালিকা') + '</button>' +
      '</div>' +
      '<button type="button" class="go" id="btnNewTask" style="height:38px;padding:0 16px;display:flex;align-items:center;gap:6px">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>' +
        '<span>' + lb('New Task', 'নতুন কাজ') + '</span>' +
      '</button>' +
    '</div>' +
  '</header>' +
  
  /* Summary Metrics Strip */
  '<section class="task-stats-strip">' +
    '<div class="stat"><small>' + lb('Total Tasks', 'মোট কাজ') + '</small><b>' + totalCount + '</b><i>' + (totalCount - doneCount) + ' ' + lb('active', 'চলমান') + '</i></div>' +
    '<div class="stat"><small style="color:var(--warn)">🟡 ' + lb('Pending', 'অমীমাংসিত') + '</small><b style="color:var(--warn)">' + pendingCount + '</b><i>' + lb('Not started', 'শুরু হয়নি') + '</i></div>' +
    '<div class="stat"><small style="color:var(--acc)">🔵 ' + lb('In Progress', 'চলমান') + '</small><b style="color:var(--acc)">' + inProgCount + '</b><i>' + lb('Being worked on', 'কাজ চলছে') + '</i></div>' +
    '<div class="stat"><small style="color:#8B5CF6">🟣 ' + lb('Under Review', 'পর্যালোচনায়') + '</small><b style="color:#8B5CF6">' + reviewCount + '</b><i>' + lb('Awaiting check', 'যাচাই বাকি') + '</i></div>' +
    '<div class="stat"><small style="color:var(--pos)">🟢 ' + lb('Completed', 'সম্পন্ন') + '</small><b style="color:var(--pos)">' + doneCount + '</b><i>' + Math.round((doneCount/(totalCount||1))*100) + '% ' + lb('finished', 'সম্পন্ন') + '</i></div>' +
  '</section>' +
  
  /* Filter & Control Bar */
  '<section class="card task-filter-bar">' +
    '<div class="tf-search">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
      '<input id="taskQ" placeholder="' + lb('Search title, tags, staff...', 'শিরোনাম, ট্যাগ বা কর্মী খুঁজুন...') + '" value="' + esc(TSK_Q) + '" autocomplete="off">' +
    '</div>' +
    '<div class="tf-controls">' +
      '<select id="taskStageFilt">' +
        '<option value="active"' + (TSK_STAGE==='active'?' selected':'') + '>' + lb('Active Tasks (excluding Done)', 'চলমান কাজসমূহ') + '</option>' +
        '<option value="all"' + (TSK_STAGE==='all'?' selected':'') + '>' + lb('All Stages', 'সব ধাপ') + '</option>' +
        TASK_STAGES.map(s => '<option value="' + s.id + '"' + (TSK_STAGE===s.id?' selected':'') + '>' + s.icon + ' ' + (S.lang==='bn'?s.bn:s.en) + '</option>').join('') +
      '</select>' +
      '<select id="taskPriorityFilt">' +
        '<option value="">' + lb('All Priorities', 'সব অগ্রাধিকার') + '</option>' +
        TASK_PRIORITIES.map(p => '<option value="' + p.id + '"' + (TSK_PRIORITY===p.id?' selected':'') + '>' + (S.lang==='bn'?p.bn:p.en) + '</option>').join('') +
      '</select>' +
      '<select id="taskAssigneeFilt">' +
        '<option value="">' + lb('All Staff', 'সকল কর্মী') + '</option>' +
        assignees.map(a => '<option value="' + esc(a) + '"' + (TSK_ASSIGNEE===a?' selected':'') + '>' + esc(a) + '</option>').join('') +
      '</select>' +
      '<select id="taskSortFilt">' +
        '<option value="deadline"' + (TSK_SORT==='deadline'?' selected':'') + '>' + lb('Sort: Deadline soonest', 'সময়সীমা: শীঘ্রই') + '</option>' +
        '<option value="priority"' + (TSK_SORT==='priority'?' selected':'') + '>' + lb('Sort: Priority highest', 'অগ্রাধিকার: বেশি') + '</option>' +
        '<option value="progress"' + (TSK_SORT==='progress'?' selected':'') + '>' + lb('Sort: Progress %', 'অগ্রগতি হার') + '</option>' +
        '<option value="newest"' + (TSK_SORT==='newest'?' selected':'') + '>' + lb('Sort: Newest first', 'নতুন আগে') + '</option>' +
      '</select>' +
      ((TSK_Q||TSK_PRIORITY||TSK_ASSIGNEE||TSK_STAGE!=='active') ? '<button type="button" class="ghost" id="taskClrFilt" style="height:36px;padding:0 10px;font-size:12.5px">' + lb('Clear', 'রিসেট') + '</button>' : '') +
    '</div>' +
  '</section>' +
  
  /* Main Content: Board View or List View */
  '<div id="taskContent">' +
    (TSK_VIEW === 'board' ? renderBoardView(all) : renderListView(filtered)) +
  '</div>';

  v.innerHTML = html;
  bindTaskEvents();
}

/* ---------- Kanban Board View ---------- */
function renderBoardView(allTasks){
  var columns = [
    { id: 'pending', title: lb('Pending', 'অমীমাংসিত'), icon: '🟡', border: 'var(--warn)' },
    { id: 'in-progress', title: lb('In Progress', 'চলমান'), icon: '🔵', border: 'var(--acc)' },
    { id: 'review', title: lb('Under Review', 'পর্যালোচনায়'), icon: '🟣', border: '#8B5CF6' },
    { id: 'complete', title: lb('Completed', 'সম্পন্ন'), icon: '🟢', border: 'var(--pos)' }
  ];

  return '<div class="task-kanban-board">' +
    columns.map(col => {
      var colTasks = allTasks.filter(t => {
        if(t.stage !== col.id) return false;
        if(TSK_PRIORITY && t.priority !== TSK_PRIORITY) return false;
        if(TSK_ASSIGNEE && t.assignee !== TSK_ASSIGNEE) return false;
        if(TSK_Q){
          var q = TSK_Q.trim().toLowerCase();
          return (t.title||'').toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q) || (t.assignee||'').toLowerCase().includes(q);
        }
        return true;
      });

      return '' +
      '<div class="task-column" data-col-stage="' + col.id + '" style="border-top:3px solid ' + col.border + '">' +
        '<div class="task-col-head">' +
          '<div class="tch-title"><span>' + col.icon + '</span> <b>' + col.title + '</b></div>' +
          '<span class="tch-count">' + colTasks.length + '</span>' +
        '</div>' +
        '<div class="task-col-body">' +
          (colTasks.length ? colTasks.map(t => renderTaskCard(t)).join('') : '<div class="task-card-empty">' + lb('No tasks', 'কোনো কাজ নেই') + '</div>') +
        '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

function renderTaskCard(t){
  var p = priorityInfo(t.priority);
  var s = stageInfo(t.stage);
  var isOver = taskOverdue(t);
  var pct = Math.min(100, Math.max(0, +t.progress || 0));

  return '' +
  '<div class="task-card' + (isOver ? ' task-card-overdue' : '') + '" data-tid="' + t.id + '">' +
    '<div class="tc-top">' +
      '<span class="tc-priority-chip" style="color:' + p.color + ';background:' + p.bg + '">' + (S.lang==='bn'?p.bn:p.en) + '</span>' +
      taskDeadlineBadge(t) +
    '</div>' +
    '<div class="tc-title">' + esc(t.title) + '</div>' +
    (t.desc ? '<div class="tc-desc">' + esc(t.desc) + '</div>' : '') +
    
    /* Progress Bar */
    '<div class="tc-progress-wrap">' +
      '<div class="tc-progress-info"><span>' + lb('Progress', 'অগ্রগতি') + '</span><b>' + (S.lang==='bn'?toBnNum(pct):pct) + '%</b></div>' +
      '<div class="task-progress-bar"><div class="task-progress-fill" style="width:' + pct + '%;' + (pct>=100?'background:var(--pos);':'') + '"></div></div>' +
    '</div>' +
    
    /* Dates & Assignee Strip */
    '<div class="tc-meta-row">' +
      '<div class="tc-dates">' +
        (t.taking ? '<span title="' + lb('Taking Date', 'গ্রহণের তারিখ') + '">📥 ' + sd(t.taking) + '</span>' : '') +
        (t.deadline ? '<span title="' + lb('Deadline', 'নির্ধারিত শেষ তারিখ') + '" class="' + (isOver?'bad':'') + '">🎯 ' + sd(t.deadline) + '</span>' : '') +
      '</div>' +
      (t.assignee ? '<div class="tc-assignee" title="' + lb('Assigned to', 'দায়িত্বপ্রাপ্ত') + '">👤 ' + esc(t.assignee) + '</div>' : '') +
    '</div>' +
    
    /* Quick Stage Advance Toolbar */
    '<div class="tc-actions-bar">' +
      '<button type="button" class="tc-btn-open" data-tact="open" data-tid="' + t.id + '">' + lb('Details & Notes', 'বিস্তারিত ও নোট') + ' (' + (t.notes?t.notes.length:0) + ')</button>' +
      '<div class="tc-advance-btns">' +
        (t.stage !== 'pending' ? '<button type="button" class="tc-btn-nav" data-tact="prev-stage" data-tid="' + t.id + '" title="' + lb('Previous Stage', 'পূর্ববর্তী ধাপ') + '">‹</button>' : '') +
        (t.stage !== 'complete' ? '<button type="button" class="tc-btn-nav primary" data-tact="next-stage" data-tid="' + t.id + '" title="' + lb('Advance Stage', 'পরবর্তী ধাপ') + '">›</button>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ---------- List View ---------- */
function renderListView(tasks){
  if(!tasks.length){
    return '<div class="card empty">' + lb('No matching tasks found', 'কোনো কাজ পাওয়া যায়নি') + '</div>';
  }

  return '' +
  '<div class="card scroll task-list-card">' +
    '<table class="task-table">' +
      '<thead>' +
        '<tr>' +
          '<th>' + lb('Status', 'অবস্থা') + '</th>' +
          '<th>' + lb('Task Title & Details', 'কাজের বিবরণ') + '</th>' +
          '<th>' + lb('Priority', 'অগ্রাধিকার') + '</th>' +
          '<th>' + lb('Progress', 'অগ্রগতি') + '</th>' +
          '<th>' + lb('Taking Date', 'গ্রহণের তারিখ') + '</th>' +
          '<th>' + lb('Deadline', 'শেষ সময়সীমা') + '</th>' +
          '<th>' + lb('Assignee', 'দায়িত্ব') + '</th>' +
          '<th></th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        tasks.map(t => {
          var p = priorityInfo(t.priority);
          var s = stageInfo(t.stage);
          var pct = Math.min(100, Math.max(0, +t.progress || 0));
          var isOver = taskOverdue(t);

          return '' +
          '<tr class="' + (t.stage==='complete'?'task-row-done':'') + (isOver?' task-row-overdue':'') + '">' +
            '<td><span class="t-stage-chip" style="color:' + s.color + ';background:' + s.bg + '">' + s.icon + ' ' + (S.lang==='bn'?s.bn:s.en) + '</span></td>' +
            '<td class="d">' +
              '<b class="task-table-title" data-tact="open" data-tid="' + t.id + '">' + esc(t.title) + '</b>' +
              (t.desc ? '<small class="mut">' + esc(t.desc) + '</small>' : '') +
              (t.tags && t.tags.length ? '<div class="task-tags-row">' + t.tags.map(tag=>'<span class="task-tag-chip">#'+esc(tag)+'</span>').join('') + '</div>' : '') +
            '</td>' +
            '<td><span class="tc-priority-chip" style="color:' + p.color + ';background:' + p.bg + '">' + (S.lang==='bn'?p.bn:p.en) + '</span></td>' +
            '<td style="min-width:130px">' +
              '<div class="tc-progress-info"><small>' + (S.lang==='bn'?toBnNum(pct):pct) + '%</small></div>' +
              '<div class="task-progress-bar"><div class="task-progress-fill" style="width:' + pct + '%;' + (pct>=100?'background:var(--pos);':'') + '"></div></div>' +
            '</td>' +
            '<td>' + (t.taking ? sd(t.taking) : '—') + '</td>' +
            '<td>' + taskDeadlineBadge(t) + '<br><small class="' + (isOver?'bad':'mut') + '">' + (t.deadline ? sd(t.deadline) : '—') + '</small></td>' +
            '<td><b>' + esc(t.assignee || '—') + '</b></td>' +
            '<td style="text-align:right;white-space:nowrap">' +
              '<button type="button" class="lnk" data-tact="open" data-tid="' + t.id + '">' + lb('Details', 'বিস্তারিত') + '</button>' +
              '<button type="button" class="lnk" data-tact="edit" data-tid="' + t.id + '">' + lb('Edit', 'এডিট') + '</button>' +
              (isA() ? '<button type="button" class="lnk" data-tact="del" data-tid="' + t.id + '" style="color:var(--neg)">×</button>' : '') +
            '</td>' +
          '</tr>';
        }).join('') +
      '</tbody>' +
    '</table>' +
  '</div>';
}

/* ---------- Event Binding ---------- */
function bindTaskEvents(){
  var seg = $('taskViewSeg');
  if(seg){
    seg.onclick = function(e){
      var btn = e.target.closest('[data-tv]');
      if(!btn) return;
      TSK_VIEW = btn.dataset.tv;
      try{localStorage.setItem('ncs_task_view', TSK_VIEW)}catch(x){}
      taskUI();
    };
  }

  var btnNew = $('btnNewTask');
  if(btnNew) btnNew.onclick = function(){ openTaskForm(null); };

  var qInp = $('taskQ');
  if(qInp){
    qInp.oninput = function(){
      TSK_Q = qInp.value;
      renderContentOnly();
    };
  }

  var sFilt = $('taskStageFilt');
  if(sFilt){
    sFilt.onchange = function(){
      TSK_STAGE = sFilt.value;
      taskUI();
    };
  }

  var pFilt = $('taskPriorityFilt');
  if(pFilt){
    pFilt.onchange = function(){
      TSK_PRIORITY = pFilt.value;
      taskUI();
    };
  }

  var aFilt = $('taskAssigneeFilt');
  if(aFilt){
    aFilt.onchange = function(){
      TSK_ASSIGNEE = aFilt.value;
      taskUI();
    };
  }

  var sortFilt = $('taskSortFilt');
  if(sortFilt){
    sortFilt.onchange = function(){
      TSK_SORT = sortFilt.value;
      taskUI();
    };
  }

  var clrBtn = $('taskClrFilt');
  if(clrBtn){
    clrBtn.onclick = function(){
      TSK_Q = ''; TSK_STAGE = 'active'; TSK_PRIORITY = ''; TSK_ASSIGNEE = ''; TSK_SORT = 'deadline';
      taskUI();
    };
  }

  var container = $('taskContent');
  if(container){
    container.onclick = function(e){
      var actionBtn = e.target.closest('[data-tact]');
      if(!actionBtn) return;
      var act = actionBtn.dataset.tact;
      var tid = actionBtn.dataset.tid;
      var task = S.tasks.find(x => x.id === tid);
      if(!task) return;

      if(act === 'open') openTaskDetail(task);
      else if(act === 'edit') openTaskForm(task);
      else if(act === 'del') deleteTask(task);
      else if(act === 'next-stage') advanceTaskStage(task, 1);
      else if(act === 'prev-stage') advanceTaskStage(task, -1);
    };
  }
}

function renderContentOnly(){
  var container = $('taskContent');
  if(!container) return;
  var all = S.tasks.filter(t => !t.removed);
  var filtered = getFilteredTasks();
  container.innerHTML = TSK_VIEW === 'board' ? renderBoardView(all) : renderListView(filtered);
}

/* ---------- Task Stage Advance / Step ---------- */
function advanceTaskStage(task, step){
  var order = ['pending', 'in-progress', 'review', 'complete'];
  var curIdx = order.indexOf(task.stage);
  if(curIdx === -1) curIdx = 0;
  var nextIdx = Math.max(0, Math.min(order.length - 1, curIdx + step));
  if(curIdx === nextIdx) return;

  var nextStage = order[nextIdx];
  task.stage = nextStage;
  if(nextStage === 'complete'){
    task.completed = todayIso();
    task.progress = 100;
  } else if(curIdx === order.indexOf('complete')){
    task.completed = null;
  }
  task.u = Date.now();
  save();
  Sound.tick();
  taskUI();
  ltoast(lb('Task stage: ', 'ধাপ পরিবর্তিত: ') + (S.lang==='bn'?stageInfo(nextStage).bn:stageInfo(nextStage).en));
}

/* ---------- Delete Task ---------- */
function deleteTask(task){
  if(!isA()){
    ltoast(lb('Only Admin can delete tasks', 'শুধু অ্যাডমিন কাজ মুছতে পারেন'));
    return;
  }
  if(confirm(lb('Delete this task: "', 'এই কাজটি মুছে ফেলবেন: "') + task.title + '"?')){
    task.removed = 1;
    task.u = Date.now();
    save();
    taskUI();
    ltoast(lb('Task deleted', 'কাজ মুছে ফেলা হয়েছে'));
  }
}

/* ---------- New / Edit Task Form Modal ---------- */
function openTaskForm(task){
  var isNew = !task;
  var t = task || {
    id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: '',
    desc: '',
    stage: 'pending',
    progress: 0,
    priority: 'medium',
    taking: todayIso(),
    deadline: '',
    completed: null,
    assignee: U ? U.name : 'Admin',
    tags: [],
    notes: []
  };

  var assignees = getAllAssignees();

  var body = '' +
  '<div class="f"><label>' + lb('Task Title *', 'কাজের শিরোনাম *') + '</label><input id="tfTitle" value="' + esc(t.title) + '" required maxlength="120" placeholder="' + lb('e.g. Restock printer paper, Fix machine...', 'যেমন: ফটোকপি কাগজ অর্ডার, মেশিন মেরামত...') + '"></div>' +
  '<div class="f"><label>' + lb('Description', 'বিবরণ') + '</label><textarea id="tfDesc" rows="3" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);color:var(--ink);box-sizing:border-box" placeholder="' + lb('Additional details or instructions...', 'প্রয়োজনীয় তথ্য বা নির্দেশাবলী...') + '">' + esc(t.desc) + '</textarea></div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="f"><label>' + lb('Priority', 'অগ্রাধিকার') + '</label><select id="tfPriority">' +
      TASK_PRIORITIES.map(p => '<option value="' + p.id + '"' + (t.priority===p.id?' selected':'') + '>' + (S.lang==='bn'?p.bn:p.en) + '</option>').join('') +
    '</select></div>' +
    '<div class="f"><label>' + lb('Assign To', 'দায়িত্বপ্রাপ্ত কর্মী') + '</label><select id="tfAssignee">' +
      assignees.map(a => '<option value="' + esc(a) + '"' + (t.assignee===a?' selected':'') + '>' + esc(a) + '</option>').join('') +
    '</select></div>' +
  '</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="f"><label>' + lb('Taking Date', 'গ্রহণের তারিখ') + '</label><input id="tfTaking" type="date" min="' + NCS_MIN_DATE + '" max="' + todayIso() + '" value="' + (t.taking || todayIso()) + '"></div>' +
    '<div class="f"><label>' + lb('Deadline', 'শেষ সময়সীমা') + '</label><input id="tfDeadline" type="date" min="' + NCS_MIN_DATE + '" data-allow-future="1" value="' + (t.deadline || '') + '"></div>' +
  '</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="f"><label>' + lb('Stage', 'কাজের ধাপ') + '</label><select id="tfStage">' +
      TASK_STAGES.map(s => '<option value="' + s.id + '"' + (t.stage===s.id?' selected':'') + '>' + s.icon + ' ' + (S.lang==='bn'?s.bn:s.en) + '</option>').join('') +
    '</select></div>' +
    '<div class="f"><label>' + lb('Progress', 'অগ্রগতি') + ': <b id="tfProgNum">' + (t.progress||0) + '%</b></label><input id="tfProg" type="range" min="0" max="100" step="5" value="' + (t.progress||0) + '" style="width:100%;accent-color:var(--acc)"></div>' +
  '</div>' +
  '<div class="f"><label>' + lb('Tags (comma separated)', 'ট্যাগ (কমা দিয়ে লিখুন)') + '</label><input id="tfTags" value="' + esc((t.tags||[]).join(', ')) + '" placeholder="stock, urgent, stationery"></div>';

  ask(isNew ? lb('Create New Task', 'নতুন কাজ তৈরি') : lb('Edit Task', 'কাজ সম্পাদনা'), body, function(){
    var title = $('tfTitle') ? $('tfTitle').value.trim() : '';
    if(!title){
      Sound.buzz();
      if($('tfTitle')) $('tfTitle').style.borderColor = 'var(--neg)';
      return false;
    }

    var taking = $('tfTaking') ? $('tfTaking').value : todayIso();
    var deadline = $('tfDeadline') ? $('tfDeadline').value : '';
    if(deadline && taking && deadline < taking){
      Sound.buzz();
      ltoast(lb('Deadline cannot be before Taking Date', 'সময়সীমা গ্রহণের তারিখের পূর্বে হতে পারবে না'));
      return false;
    }

    var stage = $('tfStage') ? $('tfStage').value : 'pending';
    var progress = $('tfProg') ? +$('tfProg').value : 0;
    var tagsRaw = $('tfTags') ? $('tfTags').value.trim() : '';
    var tags = tagsRaw ? tagsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];

    t.title = title;
    t.desc = $('tfDesc') ? $('tfDesc').value.trim() : '';
    t.priority = $('tfPriority') ? $('tfPriority').value : 'medium';
    t.assignee = $('tfAssignee') ? $('tfAssignee').value : (U ? U.name : 'Admin');
    t.taking = taking;
    t.deadline = deadline;
    t.stage = stage;
    t.progress = progress;
    t.tags = tags;
    t.u = Date.now();

    if(stage === 'complete' && !t.completed){
      t.completed = todayIso();
      t.progress = 100;
    } else if(stage !== 'complete'){
      t.completed = null;
    }

    if(isNew){
      t.created = todayIso();
      t.createdBy = U ? U.name : 'Admin';
      S.tasks.push(t);
      lg('Task created', t.title + ' [' + t.priority + ']');
    } else {
      lg('Task edited', t.title + ' [' + t.stage + ']');
    }

    save();
    Sound.chaChing();
    taskUI();
    ltoast(isNew ? lb('Task created!', 'নতুন কাজ তৈরি হয়েছে!') : lb('Task updated!', 'কাজ হালনাগাদ হয়েছে!'));
    return true;
  }, isNew ? lb('Create', 'তৈরি করুন') : lb('Save Changes', 'সংরক্ষণ'));

  var progInp = $('tfProg');
  if(progInp){
    progInp.oninput = function(){
      if($('tfProgNum')) $('tfProgNum').textContent = progInp.value + '%';
      if(+progInp.value === 100 && $('tfStage')){
        $('tfStage').value = 'complete';
      }
    };
  }

  var stgSel = $('tfStage');
  if(stgSel){
    stgSel.onchange = function(){
      if(stgSel.value === 'complete' && $('tfProg')){
        $('tfProg').value = 100;
        if($('tfProgNum')) $('tfProgNum').textContent = '100%';
      }
    };
  }
}

/* ---------- Task Details & Notes Thread Modal ---------- */
function openTaskDetail(t){
  var p = priorityInfo(t.priority);
  var s = stageInfo(t.stage);
  var pct = Math.min(100, Math.max(0, +t.progress || 0));
  var isOver = taskOverdue(t);

  var notes = Array.isArray(t.notes) ? t.notes : [];

  var html = '' +
  '<div class="task-detail-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px">' +
      '<div>' +
        '<span class="t-stage-chip" style="color:' + s.color + ';background:' + s.bg + '">' + s.icon + ' ' + (S.lang==='bn'?s.bn:s.en) + '</span> ' +
        '<span class="tc-priority-chip" style="color:' + p.color + ';background:' + p.bg + '">' + (S.lang==='bn'?p.bn:p.en) + '</span>' +
      '</div>' +
      taskDeadlineBadge(t) +
    '</div>' +

    '<h3 style="margin:0 0 8px;font-size:17px">' + esc(t.title) + '</h3>' +
    (t.desc ? '<p style="margin:0 0 12px;font-size:13.5px;color:var(--mut);line-height:1.5">' + esc(t.desc) + '</p>' : '') +

    /* Progress interactive slider */
    '<div class="card" style="padding:10px 14px;margin-bottom:12px;background:var(--bg)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:12.5px;font-weight:600">' + lb('Progress Slider', 'অগ্রগতি স্লাইডার') + '</span>' +
        '<b id="tdProgNum" style="color:var(--acc);font-size:15px">' + (S.lang==='bn'?toBnNum(pct):pct) + '%</b>' +
      '</div>' +
      '<input id="tdProg" type="range" min="0" max="100" step="5" value="' + pct + '" style="width:100%;accent-color:var(--acc)">' +
      '<div style="display:flex;gap:6px;margin-top:8px">' +
        '<button type="button" class="ghost" data-prog-step="25" style="height:26px;font-size:11px;padding:0 8px">25%</button>' +
        '<button type="button" class="ghost" data-prog-step="50" style="height:26px;font-size:11px;padding:0 8px">50%</button>' +
        '<button type="button" class="ghost" data-prog-step="75" style="height:26px;font-size:11px;padding:0 8px">75%</button>' +
        '<button type="button" class="ghost" data-prog-step="100" style="height:26px;font-size:11px;padding:0 8px;color:var(--pos);font-weight:700">100% ✔</button>' +
      '</div>' +
    '</div>' +

    /* Meta table */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px;margin-bottom:14px">' +
      '<div class="card" style="padding:8px 10px;margin:0"><b>' + lb('Assignee', 'দায়িত্বপ্রাপ্ত') + ':</b> ' + esc(t.assignee || '—') + '</div>' +
      '<div class="card" style="padding:8px 10px;margin:0"><b>' + lb('Taking Date', 'গ্রহণের তারিখ') + ':</b> ' + (t.taking ? sd(t.taking) : '—') + '</div>' +
      '<div class="card" style="padding:8px 10px;margin:0"><b>' + lb('Deadline', 'সময়সীমা') + ':</b> <span class="' + (isOver?'bad':'') + '">' + (t.deadline ? sd(t.deadline) : '—') + '</span></div>' +
      '<div class="card" style="padding:8px 10px;margin:0"><b>' + lb('Completed', 'সমাপ্তির তারিখ') + ':</b> ' + (t.completed ? sd(t.completed) : '—') + '</div>' +
    '</div>' +

    /* Collaborative Notes Thread */
    '<div class="task-notes-section">' +
      '<h4 style="margin:0 0 8px;font-size:13.5px;display:flex;justify-content:space-between">' +
        '<span>💬 ' + lb('Activity & Notes Thread', 'মন্তব্য ও নোটের বিবরণ') + ' (' + notes.length + ')</span>' +
      '</h4>' +
      '<div id="tdNotesList" style="max-height:160px;overflow-y:auto;margin-bottom:10px;display:flex;flex-direction:column;gap:6px">' +
        (notes.length ? notes.map(n => '' +
          '<div class="card" style="padding:7px 10px;margin:0;font-size:12.5px;background:var(--bg)">' +
            '<div style="display:flex;justify-content:space-between;color:var(--mut);font-size:11px;margin-bottom:2px">' +
              '<b>' + esc(n.by) + '</b><span>' + esc(n.t) + '</span>' +
            '</div>' +
            '<div>' + esc(n.text) + '</div>' +
          '</div>'
        ).join('') : '<div class="mut" style="font-size:12px;padding:6px 0">' + lb('No notes yet. Add progress update below.', 'কোনো মন্তব্য নেই। নিচে নোট যোগ করুন।') + '</div>') +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<input id="tdNewNote" placeholder="' + lb('Add a progress note...', 'কাজের অগ্রগতির নোট লিখুন...') + '" style="height:36px;font-size:13px">' +
        '<button type="button" class="go" id="tdBtnAddNote" style="height:36px;padding:0 14px;font-size:13px">' + lb('Add', 'যোগ') + '</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  ask(lb('Task Details', 'কাজের বিস্তারিত'), html, function(){
    /* Save progress changes made directly in detail view */
    var pVal = $('tdProg') ? +$('tdProg').value : pct;
    if(pVal !== pct){
      t.progress = pVal;
      if(pVal === 100){
        t.stage = 'complete';
        t.completed = todayIso();
      }
      t.u = Date.now();
      save();
      taskUI();
    }
    return true;
  }, lb('Close', 'বন্ধ করুন'), 1);

  /* Bind slider & quick steps inside detail dialog */
  var pSlider = $('tdProg');
  if(pSlider){
    pSlider.oninput = function(){
      if($('tdProgNum')) $('tdProgNum').textContent = pSlider.value + '%';
    };
  }

  $('ob').onclick = function(e){
    var stepBtn = e.target.closest('[data-prog-step]');
    if(stepBtn){
      var v = +stepBtn.dataset.progStep;
      if(pSlider) pSlider.value = v;
      if($('tdProgNum')) $('tdProgNum').textContent = v + '%';
      return;
    }

    if(e.target.id === 'tdBtnAddNote'){
      var noteInp = $('tdNewNote');
      if(!noteInp) return;
      var txt = noteInp.value.trim();
      if(!txt){
        Sound.buzz();
        noteInp.style.borderColor = 'var(--neg)';
        return;
      }
      if(!Array.isArray(t.notes)) t.notes = [];
      var now = new Date();
      var timeStr = sd(todayIso()) + ' ' + t12(String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'));
      t.notes.push({
        id: 'n_' + Date.now(),
        text: txt,
        by: U ? U.name : 'Staff',
        t: timeStr
      });
      t.u = Date.now();
      save();
      Sound.tick();
      openTaskDetail(t); // re-render with updated notes
    }
  };
}

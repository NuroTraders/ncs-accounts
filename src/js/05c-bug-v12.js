/* ---------- 05c-bug-v12: Contextual Tab Bug Reporting System (v12) ---------- */

function getActiveTabKey(){
  return (typeof CUR !== 'undefined' && CUR) ? CUR : 'home';
}

function getActiveTabLabel(k){
  var key = k || getActiveTabKey();
  if (S && S.lang === 'bn' && typeof TL_BN !== 'undefined' && TL_BN[key]) {
    return TL_BN[key];
  }
  if (typeof TL !== 'undefined' && TL[key]) {
    return TL[key];
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function generateReportMarkdown(rep){
  return '# [BUG REPORT] ' + rep.tabName + '\n' +
    '- **Report ID**: `' + rep.id + '`\n' +
    '- **Tab / View**: ' + rep.tabName + ' (`' + rep.tabKey + '`)\n' +
    '- **Reporter**: ' + rep.reporterName + ' (' + rep.reporterRole + ')\n' +
    '- **Date**: ' + rep.date + '\n' +
    '- **Time**: ' + rep.time + '\n' +
    '- **App Version**: ' + rep.appVersion + '\n' +
    '- **Status**: ' + rep.status + '\n\n' +
    '---\n\n' +
    '## 1. 🚨 Bugs / Errors\n' +
    rep.bugs + '\n\n' +
    '---\n\n' +
    '## 2. 💡 Requirements / Proposed Solutions\n' +
    (rep.reqs ? rep.reqs : '*(No specific requirement provided)*') + '\n\n' +
    '---\n' +
    '*Reported via NCS Daily Accounts (Bug Report System v12)*\n';
}

function openTabBugModal(){
  if (!U) {
    if (typeof ltoast === 'function') ltoast(lb('Please log in first', 'অনুগ্রহ করে প্রথমে লগইন করুন'));
    return;
  }
  var tabKey = getActiveTabKey();
  var tabName = getActiveTabLabel(tabKey);
  var roleName = (typeof role === 'function' ? role() : (U.role || 'staff'));
  var repName = U.name || 'Staff';
  var now = new Date();
  var dateStr = (typeof iso === 'function' ? iso(now) : now.toISOString().slice(0, 10));
  var timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  var html = '' +
    '<div class="v12-badge-row">' +
      '<span class="v12-tab-pill">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
        lb('Tab: ', 'ট্যাব: ') + '<b>' + esc(tabName) + '</b>' +
      '</span>' +
      '<span class="v12-meta-pill">' +
        lb('Reporter: ', 'রিপোর্টার: ') + esc(repName) + ' (' + esc(roleName) + ')' +
      '</span>' +
      '<span class="v12-meta-pill">' +
        esc(dateStr) + ' ' + esc(timeStr) +
      '</span>' +
    '</div>' +
    '<div class="v12-f">' +
      '<label for="v12BugInput">' +
        '<span>' + lb('1. Bugs / Errors *', '১. ত্রুটি বা সমস্যা *') + '</span>' +
        '<small class="mut">' + lb('Specific to this tab', 'এই ট্যাবের সমস্যা') + '</small>' +
      '</label>' +
      '<textarea id="v12BugInput" rows="3" placeholder="' + lb('Describe what went wrong, visual glitches, or calculation errors in this tab...', 'এই ট্যাবের যে ত্রুটি বা হিসাবের সমস্যা হচ্ছে তা লিখুন...') + '"></textarea>' +
    '</div>' +
    '<div class="v12-f">' +
      '<label for="v12ReqInput">' +
        '<span>' + lb('2. Requirements / Solution', '২. চাহিদা ও প্রয়োজনীয় সমাধান') + '</span>' +
        '<small class="mut">' + lb('How should it work?', 'কীভাবে সমাধান হতে হবে?') + '</small>' +
      '</label>' +
      '<textarea id="v12ReqInput" rows="3" placeholder="' + lb('Describe your required solution, desired workflow, or improvements for this tab...', 'আপনার প্রত্যাশিত সমাধান বা কী ফিচার প্রয়োজন তা লিখুন...') + '"></textarea>' +
    '</div>' +
    '<p class="mut" style="font-size:11.5px;margin:8px 0 0;line-height:1.4">' +
      lb('Report will be saved to app storage and formatted as a Markdown (.md) document for admin review.', 'রিপোর্টটি অ্যাপ স্টোরেজে সংরক্ষিত হবে এবং মার্কডাউন (.md) ফাইল হিসেবে অ্যাডমিন দেখতে পারবেন।') +
    '</p>';

  ask(lb('Bug Report — ' + tabName, 'বাগ রিপোর্ট — ' + tabName), html, function(){
    var bugInput = $('v12BugInput');
    var reqInput = $('v12ReqInput');
    var bugs = bugInput ? bugInput.value.trim() : '';
    var reqs = reqInput ? reqInput.value.trim() : '';

    if (!bugs) {
      if (typeof ltoast === 'function') ltoast(lb('Please describe the bug or error', 'দয়া করে ত্রুটি বা সমস্যার বিবরণ লিখুন'));
      if (bugInput) bugInput.focus();
      return false;
    }

    var repId = 'BUG-' + tabKey.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    var appVer = (typeof APP_VERSION !== 'undefined' ? ('v' + APP_VERSION) : 'v11.0.0-beta');

    var newReport = {
      id: repId,
      tabKey: tabKey,
      tabName: tabName,
      reporterName: repName,
      reporterRole: roleName,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      bugs: bugs,
      reqs: reqs,
      status: 'Open',
      appVersion: appVer
    };

    newReport.md = generateReportMarkdown(newReport);

    S.bugReportsV12 = S.bugReportsV12 || [];
    S.bugReportsV12.unshift(newReport);
    save();

    if (typeof push === 'function') {
      try { push(); } catch(e) {}
    }

    if (typeof ltoast === 'function') {
      ltoast(lb('Bug report saved successfully!', 'বাগ রিপোর্ট সফলভাবে সংরক্ষিত হয়েছে!'));
    }

    setTimeout(function(){
      ask(lb('Report Saved', 'রিপোর্ট সংরক্ষিত'),
        '<p style="font-size:13.5px">' + lb('Report <b>' + repId + '</b> for <b>' + esc(tabName) + '</b> has been recorded.', '<b>' + esc(tabName) + '</b> এর রিপোর্ট <b>' + repId + '</b> সংরক্ষিত হয়েছে।') + '</p>' +
        '<div style="display:flex;gap:8px;margin-top:12px">' +
          '<button type="button" class="ghost" id="v12QuickDl" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:38px">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' +
            '<span>' + lb('Download Markdown (.md)', 'মার্কডাউন (.md) ডাউনলোড') + '</span>' +
          '</button>' +
        '</div>',
        function(){ return true; },
        lb('Done', 'সম্পন্ন')
      );
      var dlBtn = $('v12QuickDl');
      if (dlBtn) {
        dlBtn.onclick = function(){
          if (typeof dlFile === 'function') {
            dlFile('Bug_' + tabKey + '_' + dateStr + '_' + repId + '.md', newReport.md);
          }
        };
      }
    }, 200);

    return true;
  }, lb('Save Report', 'রিপোর্ট সংরক্ষণ'), true);
}

function openBugReportsV12Admin(){
  if (!isA()) return;
  var reports = (S.bugReportsV12 && Array.isArray(S.bugReportsV12)) ? S.bugReportsV12 : [];
  var activeFilter = 'all';

  function renderList(filter){
    var filtered = reports;
    if (filter && filter !== 'all') {
      filtered = reports.filter(function(r){ return r.tabKey === filter; });
    }

    var tabsMap = (typeof TL !== 'undefined') ? TL : {home:'Overview',task:'Task Schedule',led:'Ledger',pos:'Counter',acc:'Accounts',more:'More'};
    var tabKeys = ['all'].concat(Object.keys(tabsMap));

    var filterChips = tabKeys.map(function(k){
      var count = (k === 'all') ? reports.length : reports.filter(function(r){ return r.tabKey === k; }).length;
      var lbl = (k === 'all') ? lb('All', 'সকল') : (tabsMap[k] || k);
      var isOn = (filter === k) ? 'class="on"' : '';
      return '<button type="button" data-v12f="' + k + '" ' + isOn + ' style="font-size:12px;padding:4px 10px;height:28px">' + esc(lbl) + ' (' + count + ')</button>';
    }).join('');

    var itemsHtml = '';
    if (!filtered.length) {
      itemsHtml = '<div class="empty" style="text-align:center;padding:24px 0;color:var(--mut)">' +
        lb('No bug reports found for this filter.', 'কোনো বাগ রিপোর্ট পাওয়া যায়নি।') +
      '</div>';
    } else {
      itemsHtml = filtered.map(function(r, idx){
        var isOpen = (r.status !== 'Resolved');
        var statusBadge = isOpen
          ? '<span class="v12-status-open">' + lb('Open', 'চলমান') + '</span>'
          : '<span class="v12-status-resolved">' + lb('Resolved', 'সমাধানকৃত') + '</span>';

        return '' +
          '<div class="v12-report-card" data-rid="' + esc(r.id) + '">' +
            '<div class="v12-card-head">' +
              '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                '<span class="v12-tab-pill">📍 ' + esc(r.tabName) + '</span>' +
                statusBadge +
                '<code style="font-size:11px;color:var(--mut)">' + esc(r.id) + '</code>' +
              '</div>' +
              '<small class="mut" style="font-size:11.5px">' + esc(r.date) + ' ' + esc(r.time) + '</small>' +
            '</div>' +
            '<div style="font-size:12px;color:var(--mut);margin-bottom:8px">' +
              lb('Reporter: ', 'রিপোর্টার: ') + '<b>' + esc(r.reporterName) + '</b> (' + esc(r.reporterRole) + ') · ' + esc(r.appVersion || '') +
            '</div>' +
            '<div class="v12-card-body">' +
              '<div class="v12-card-sec"><b>' + lb('1. Bugs / Errors:', '১. ত্রুটি বা সমস্যা:') + '</b><div>' + esc(r.bugs) + '</div></div>' +
              '<div class="v12-card-sec"><b>' + lb('2. Requirement / Solution:', '২. চাহিদা ও সমাধান:') + '</b><div>' + esc(r.reqs || lb('(None provided)', '(দেওয়া হয়নি)')) + '</div></div>' +
            '</div>' +
            '<div class="v12-card-actions">' +
              '<button type="button" class="ghost" data-v12dl="' + esc(r.id) + '" style="height:28px;padding:0 8px;font-size:11.5px">📥 ' + lb('Download .md', '.md ডাউনলোড') + '</button>' +
              '<button type="button" class="ghost" data-v12cp="' + esc(r.id) + '" style="height:28px;padding:0 8px;font-size:11.5px">📋 ' + lb('Copy Markdown', 'কপি') + '</button>' +
              '<button type="button" class="ghost" data-v12st="' + esc(r.id) + '" style="height:28px;padding:0 8px;font-size:11.5px">🔄 ' + (isOpen ? lb('Mark Resolved', 'সমাধান চিহ্নিত') : lb('Reopen', 'পুনরায় চালু')) + '</button>' +
              '<button type="button" class="ghost" data-v12del="' + esc(r.id) + '" style="height:28px;padding:0 8px;font-size:11.5px;color:var(--neg)">🗑️ ' + lb('Delete', 'মুছুন') + '</button>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    return '' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
        '<div style="font-size:13px;font-weight:600">' +
          lb('Total Reports: ', 'মোট রিপোর্ট: ') + '<b>' + reports.length + '</b>' +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button type="button" class="go" id="v12DlAll" style="height:32px;padding:0 12px;font-size:12px;background:var(--acc)">' +
            '📦 ' + lb('Download All (.md)', 'সকল রিপোর্ট (.md) ডাউনলোড') +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ptabs" id="v12TabsFilter" style="margin-bottom:12px;overflow-x:auto;display:flex;gap:4px">' +
        filterChips +
      '</div>' +
      '<div class="v12-admin-list" id="v12ListWrap">' +
        itemsHtml +
      '</div>';
  }

  ask(lb('Tab Bug Reports (v12)', 'ট্যাব বাগ ও সমাধান রিপোর্ট (v12)'), renderList(activeFilter), function(){
    return true;
  }, lb('Close', 'বন্ধ করুন'), true);

  function attachAdminEvents(){
    var ob = $('ob');
    if (!ob) return;

    ob.onclick = function(e){
      var fBtn = e.target.closest('[data-v12f]');
      if (fBtn) {
        activeFilter = fBtn.dataset.v12f;
        ob.innerHTML = renderList(activeFilter);
        attachAdminEvents();
        return;
      }

      var dlBtn = e.target.closest('[data-v12dl]');
      if (dlBtn) {
        var id = dlBtn.dataset.v12dl;
        var rep = reports.find(function(x){ return x.id === id; });
        if (rep && typeof dlFile === 'function') {
          dlFile('Bug_' + rep.tabKey + '_' + rep.date + '_' + rep.id + '.md', rep.md || generateReportMarkdown(rep));
        }
        return;
      }

      var cpBtn = e.target.closest('[data-v12cp]');
      if (cpBtn) {
        var id = cpBtn.dataset.v12cp;
        var rep = reports.find(function(x){ return x.id === id; });
        if (rep) {
          var mdText = rep.md || generateReportMarkdown(rep);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(mdText).then(function(){
              if (typeof ltoast === 'function') ltoast(lb('Markdown copied to clipboard!', 'মার্কডাউন ক্লিপবোর্ডে কপি হয়েছে!'));
            });
          } else {
            prompt(lb('Copy Markdown:', 'মার্কডাউন কপি করুন:'), mdText);
          }
        }
        return;
      }

      var stBtn = e.target.closest('[data-v12st]');
      if (stBtn) {
        var id = stBtn.dataset.v12st;
        var rep = reports.find(function(x){ return x.id === id; });
        if (rep) {
          rep.status = (rep.status === 'Resolved') ? 'Open' : 'Resolved';
          rep.md = generateReportMarkdown(rep);
          save();
          ob.innerHTML = renderList(activeFilter);
          attachAdminEvents();
        }
        return;
      }

      var delBtn = e.target.closest('[data-v12del]');
      if (delBtn) {
        var id = delBtn.dataset.v12del;
        if (confirm(lb('Delete this bug report?', 'এই বাগ রিপোর্টটি মুছে ফেলতে চান?'))) {
          S.bugReportsV12 = (S.bugReportsV12 || []).filter(function(x){ return x.id !== id; });
          reports = S.bugReportsV12;
          save();
          ob.innerHTML = renderList(activeFilter);
          attachAdminEvents();
        }
        return;
      }

      var dlAllBtn = e.target.closest('#v12DlAll');
      if (dlAllBtn) {
        var combinedMd = '# NCS Accounts — All Bug & Requirement Reports (v12)\n' +
          '*Exported on ' + (new Date()).toLocaleString() + ' by ' + (U ? U.name : 'Admin') + '*\n' +
          '*Total Reports: ' + reports.length + '*\n\n' +
          '---\n\n' +
          reports.map(function(r, i){
            return '### #' + (i + 1) + ' — [' + r.status + '] ' + r.tabName + ' (`' + r.id + '`)\n' +
              (r.md || generateReportMarkdown(r)) + '\n\n';
          }).join('\n---\n\n');

        if (typeof dlFile === 'function') {
          dlFile('NCS_All_Bug_Reports_v12.md', combinedMd);
        }
        return;
      }
    };
  }

  attachAdminEvents();
}

function initTabBugFab(){
  var fab = $('tabBugFab');
  if (fab) {
    fab.onclick = function(e){
      e.preventDefault();
      openTabBugModal();
    };
  }
}

document.addEventListener('DOMContentLoaded', initTabBugFab);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initTabBugFab();
}

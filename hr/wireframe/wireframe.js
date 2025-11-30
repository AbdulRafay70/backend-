// Minimal wireframe JS: navigation helper, modal and simple action simulation
(function(){
  function createModalIfMissing(){
    if(document.getElementById('wf-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'wf-modal'; modal.className = 'wf-modal';
    modal.innerHTML = `
      <div class="wf-modal-backdrop" data-wf-close></div>
      <div class="wf-modal-content">
        <button class="wf-close" data-wf-close>×</button>
        <div id="wf-modal-body" class="wf-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function openModal(html){
    createModalIfMissing();
    const m = document.getElementById('wf-modal');
    document.getElementById('wf-modal-body').innerHTML = html;
    m.classList.add('show');
  }
  function closeModal(){
    const m = document.getElementById('wf-modal');
    if(m) m.classList.remove('show');
  }

  // Delegate clicks for prototype actions
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t.closest && t.closest('[data-wf-close]')){ closeModal(); return; }

    // Buttons by text (simple heuristic for prototype)
    if(t.tagName === 'BUTTON' || t.tagName === 'A'){
      const txt = (t.textContent||'').trim().toLowerCase();
      if(txt === 'mark paid' || txt === 'mark paid'){
        e.preventDefault();
        openModal('<h3>Mark Commission Paid</h3><p>Mark this commission as paid?</p><p><button class="btn primary" id="_wf_confirm">Confirm</button> <button class="btn ghost" data-wf-close>Cancel</button></p>');
        return;
      }
      if(txt === 'start movement' || txt === 'start'){
        e.preventDefault();
        openModal('<h3>Start Movement</h3><p>Enter details (prototype):</p><p><input placeholder="Destination" style="width:100%;padding:8px;border:1px solid #e6e9ef;border-radius:6px" /></p><p><button class="btn primary" id="_wf_confirm">Start</button> <button class="btn ghost" data-wf-close>Cancel</button></p>');
        return;
      }
      if(txt === 'end' || txt === 'end movement'){
        e.preventDefault();
        openModal('<h3>End Movement</h3><p>Confirm end movement?</p><p><button class="btn primary" id="_wf_confirm">End</button> <button class="btn ghost" data-wf-close>Cancel</button></p>');
        return;
      }
      if(txt === 'check in' || txt === 'mark present' || txt === 'bulk check-in'){
        e.preventDefault();
        openModal('<h3>Check In</h3><p>Simulate check-in for employee(s).</p><p><button class="btn primary" id="_wf_confirm">Check In</button> <button class="btn ghost" data-wf-close>Cancel</button></p>');
        return;
      }
      if(txt === 'add employee' || txt === 'add commission' || txt === 'add employee'){
        e.preventDefault();
        openModal('<h3>Add (prototype)</h3><p>Form is not functional in this static prototype.</p><p><button class="btn primary" data-wf-close>OK</button></p>');
        return;
      }
    }
  });

  // Confirm button handler inside modal
  document.addEventListener('click', function(e){
    const el = e.target;
    if(el && el.id === '_wf_confirm'){
      // simple feedback
      const body = document.getElementById('wf-modal-body');
      body.innerHTML = '<h3>Done</h3><p class="muted">Action simulated in the prototype.</p><p><button class="btn ghost" data-wf-close>Close</button></p>';
    }
  });

  // Add a small nav to pages that don't have one
  document.addEventListener('DOMContentLoaded', function(){
    createModalIfMissing();
    if(!document.querySelector('.wire-nav')){
      const nav = document.createElement('nav'); nav.className = 'wire-nav container';
      nav.innerHTML = '<a href="index.html">Index</a> <a href="employees_list.html">Employees</a> <a href="employee_profile.html">Profile</a> <a href="attendance_dashboard.html">Attendance</a> <a href="movements.html">Movements</a> <a href="commissions.html">Commissions</a>';
      const header = document.querySelector('.topbar');
      if(header && header.parentNode) header.parentNode.insertBefore(nav, header.nextSibling);
    }
  });

})();

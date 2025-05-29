document.addEventListener('DOMContentLoaded', () => {
  const livestockId = document.getElementById('livestock_id').value;

  const fetchLogs = async (url = `/logs/${livestockId}`, method = 'GET', data = null) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : null
    });
    return await res.json();
  };

  const loadLogs = async () => {
    const logs = await fetchLogs();
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.log_date}</td>
        <td>${log.feed}</td>
        <td>${log.production}</td>
        <td>${log.symptoms}</td>
        <td>
          <button onclick="deleteLog(${log.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  // Add Log
  document.getElementById('logForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const log = {
      livestock_id: livestockId,
      log_date: document.getElementById('log_date').value,
      feed: document.getElementById('feed').value,
      production: document.getElementById('production').value,
      symptoms: document.getElementById('symptoms').value,
    };
    await fetchLogs('/logs', 'POST', log);
    loadLogs();
    e.target.reset();
  });

  // Filter Logs
  document.getElementById('filterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const logs = await fetchLogs(`/logs/filter/${livestockId}`, 'POST', { startDate, endDate });
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.log_date}</td>
        <td>${log.feed}</td>
        <td>${log.production}</td>
        <td>${log.symptoms}</td>
        <td>
          <button onclick="deleteLog(${log.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });

  // Delete Log
  window.deleteLog = async (id) => {
    await fetchLogs(`/logs/${id}`, 'DELETE');
    loadLogs();
  };

  loadLogs();
});

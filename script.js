const GOAL = 10000;
const STORAGE_KEY = 'assinaturasFelipeBarros';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZLQBNgDGeviVyK3Vne7t8YemE8wjAy9WM-WoZQoxa_5r8WrxGBT85uoRyrACrbaDv5Q/exec';
let signatures = [];
let displayedCount = 0;

function formatNum(n) {
  return n.toLocaleString('pt-BR');
}

function getBairro(endereco) {
  const partes = endereco.split(',').map(s => s.trim()).filter(Boolean);
  return partes[1] || partes[0] || 'Não informado';
}

function saveSignatures() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
}

function fetchRemoteCount(animate) {
  fetch(SCRIPT_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && typeof data.total !== 'undefined') {
        var total = parseInt(data.total, 10) || 0;
        if (total >= displayedCount) {
          displayedCount = total;
          updateUI(displayedCount, animate);
        }
      }
    })
    .catch(function() {
      /* Se falhar, mantém o valor atual */
    });
}

function loadSignatures() {
  var saved = localStorage.getItem(STORAGE_KEY);
  signatures = saved ? JSON.parse(saved) : [];

  /* Mostra contagem local imenuiatamente enquanto busca o total remoto */
  if (signatures.length > 0) {
    displayedCount = signatures.length;
    updateUI(displayedCount, false);
  }

  /* Busca total real da planilha (vale para todos os navegadores) */
  fetchRemoteCount(false);
}

function updateUI(n, animate) {
  const pct = Math.min(100, (n / GOAL) * 100);
  const left = Math.max(0, GOAL - n);

  document.getElementById('progressFill').style.width = pct.toFixed(2) + '%';
  document.getElementById('progressPct').textContent = pct.toFixed(1) + '%';
  document.getElementById('progressCount').innerHTML = formatNum(n) + ' <span>/ Meta: ' + formatNum(GOAL) + '</span>';
  document.getElementById('remainingText').textContent = left > 0 ? 'Faltam ' + formatNum(left) + ' para a meta' : 'Meta atingida!';

  const el = document.getElementById('liveNum');
  el.textContent = formatNum(n);

  if (animate) {
    el.style.color = '#6effa0';
    setTimeout(function() { el.style.color = ''; }, 600);
  }
}

function renderSheet() {}

/* Máscaras e busca automática via ViaCEP */
document.addEventListener('DOMContentLoaded', function() {
  /* Máscara CEP */
  var cepInput = document.getElementById('cep');
  cepInput.addEventListener('input', function(e) {
    var v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;
    var cepLimpo = v.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCEP(cepLimpo);
    }
  });

  /* Máscara Celular: (99) 9 9999-9999 ou (99) 9999-9999 */
  var telInput = document.getElementById('tel');
  telInput.addEventListener('input', function(e) {
    var d = e.target.value.replace(/\D/g, '').slice(0, 11);
    var v = d;
    if (d.length > 10) {
      v = '(' + d.slice(0,2) + ') ' + d.slice(2,3) + ' ' + d.slice(3,7) + '-' + d.slice(7);
    } else if (d.length > 6) {
      v = '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    } else if (d.length > 2) {
      v = '(' + d.slice(0,2) + ') ' + d.slice(2);
    } else if (d.length > 0) {
      v = '(' + d;
    }
    e.target.value = v;
  });

});

function buscarCEP(cep) {
  fetch('https://viacep.com.br/ws/' + cep + '/json/')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.erro) {
        var ruaInput = document.getElementById('rua');
        if (!ruaInput.value) {
          ruaInput.value = data.logradouro || '';
        }
        var bairroInput = document.getElementById('bairro');
        bairroInput.value = data.bairro || '';
        document.getElementById('numero').focus();
      }
    })
    .catch(function(err) {
      console.warn('CEP não encontrado:', err);
    });
}

function clearErrors() {
  document.querySelectorAll('.form-input.error').forEach(function(el) { el.classList.remove('error'); });
  document.querySelectorAll('.field-error').forEach(function(el) { el.style.display = 'none'; });
}

function showError(inputId, msgId) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(msgId).style.display = 'block';
}

function validateEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

function validatePhone(tel) {
  var digits = tel.replace(/\D/g, '');
  /* Celular com DDD: 10 dígitos (fixo) ou 11 dígitos (celular) */
  if (digits.length < 10 || digits.length > 11) return false;
  var ddd = parseInt(digits.slice(0, 2), 10);
  /* DDDs válidos no Brasil: 11-99 exceto inexistentes */
  if (ddd < 11 || ddd > 99) return false;
  /* Celular com 11 dígitos deve ter 9 como 3º dígito */
  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}



function validateCEP(cep) {
  return /^\d{5}-?\d{3}$/.test(cep);
}

function validateRua(rua) {
  return rua.length >= 3;
}

function handleSign() {
  clearErrors();
  var ok = true;

  var nome = document.getElementById('nome').value.trim();
  var tel = document.getElementById('tel').value.trim();
  var mail = document.getElementById('mail').value.trim();
  var rua = document.getElementById('rua').value.trim();
  var numero = document.getElementById('numero').value.trim();
  var cep = document.getElementById('cep').value.trim();

  if (!nome) { showError('nome','erroNome'); ok = false; }

  if (!tel || !validatePhone(tel)) { showError('tel','erroTel'); ok = false; }

  if (!mail || !validateEmail(mail)) { showError('mail','erroMail'); ok = false; }

  if (!rua || !validateRua(rua) || !numero) {
    showError('rua','erroRua');
    if (!numero) document.getElementById('numero').classList.add('error');
    ok = false;
  }

  var bairro = document.getElementById('bairro').value.trim();
  if (!bairro) { showError('bairro','erroBairro'); ok = false; }

  if (!cep || !validateCEP(cep)) { showError('cep','erroCep'); ok = false; }

  if (!ok) return;

  var complemento = document.getElementById('complemento').value.trim();
  var bairroVal = bairro;
  var endereco = rua + ', ' + numero + (complemento ? ' - ' + complemento : '') + ', ' + bairroVal + ' — CEP ' + cep;

  /* ── Envia para Google Planilhas ── */
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome, tel: tel, mail: mail, endereco: endereco })
  }).catch(function(err) { console.warn('Erro ao enviar para planilha:', err); });

  var agora = new Date();
  signatures.push({
    nome: nome,
    tel: tel,
    mail: mail,
    endereco: endereco,
    bairro: bairroVal,
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  saveSignatures();
  renderSheet();

  /* Incrementa otimisticamente +1 e atualiza a UI */
  displayedCount++;
  updateUI(displayedCount, true);

  /* Re-busca o total real do servidor após 3s para sincronizar */
  setTimeout(function() { fetchRemoteCount(false); }, 3000);

  document.getElementById('nome').value = '';
  document.getElementById('tel').value = '';
  document.getElementById('mail').value = '';
  document.getElementById('rua').value = '';
  document.getElementById('numero').value = '';
  document.getElementById('complemento').value = '';
  document.getElementById('bairro').value = '';
  document.getElementById('cep').value = '';

  var toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

window.addEventListener('DOMContentLoaded', function() {
  /* ?reset na URL limpa todos os dados locais */
  if (window.location.search.indexOf('reset') !== -1) {
    localStorage.removeItem(STORAGE_KEY);
    signatures = [];
    alert('Dados locais limpos com sucesso!');
    window.location.href = window.location.pathname;
    return;
  }
  loadSignatures();
  renderSheet();
});

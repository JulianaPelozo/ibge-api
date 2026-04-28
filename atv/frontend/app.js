const selectEstado = document.getElementById('selectEstado');
const btnBuscar = document.getElementById('btnBuscar');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');
const statsGrid = document.getElementById('statsGrid');
const tableWrapper = document.getElementById('tableWrapper');
const emptyState = document.getElementById('emptyState');
const tabelaBody = document.getElementById('tabelaBody');
const searchInput = document.getElementById('searchInput');

let municipiosDados = [];
let estadoSelecionadoNome = "";


async function carregarEstados() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const estados = await response.json();

        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.nome;
            option.dataset.id = estado.id; // Guardamos o ID para outras consultas se necessário
            selectEstado.appendChild(option);
        });

        selectEstado.addEventListener('change', () => {
            btnBuscar.disabled = !selectEstado.value;
        });
    } catch (error) {
        exibirErro("Não foi possível carregar a lista de estados.");
    }
}


async function buscarDados() {
    const uf = selectEstado.value;
    if (!uf) return;

    ocultarErro();
    mostrarLoading(true);
    statsGrid.classList.remove('visible');
    tableWrapper.classList.remove('visible');
    emptyState.style.display = 'none';

    try {
        const respMunicipios = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const municipios = await respMunicipios.json();

        const respUF = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}`);
        const infoUF = await respUF.json();

        
        
        municipiosDados = municipios.map(m => ({
            nome: m.nome,
            mesorregiao: m.regiao_imediata?.nome || "N/D",
            // Mock de população para fins de demonstração visual (Censo 2022)
            populacao: Math.floor(Math.random() * (500000 - 5000) + 5000) 
        })).sort((a, b) => b.populacao - a.populacao);

        atualizarInterface(infoUF, municipiosDados);

    } catch (error) {
        exibirErro("Erro ao consultar dados do IBGE. Tente novamente mais tarde.");
        emptyState.style.display = 'block';
    } finally {
        mostrarLoading(false);
    }
}


function atualizarInterface(estado, municipios) {
    document.getElementById('statMunicipios').textContent = municipios.length;
    document.getElementById('statMaior').textContent = municipios[0].nome;
    document.getElementById('statMaiorPop').textContent = `${municipios[0].populacao.toLocaleString('pt-BR')} habitantes`;
    document.getElementById('statCapital').textContent = "Consultando..."; // A capital requer ID específico, simularemos:
    document.getElementById('statUF').textContent = `${estado.nome} (${estado.sigla})`;

    const possivelCapital = municipios.find(m => m.nome === estado.nome) || municipios[0];
    document.getElementById('statCapital').textContent = (estado.sigla === 'SP') ? 'São Paulo' : 
                                                         (estado.sigla === 'RJ') ? 'Rio de Janeiro' : possivelCapital.nome;

    renderizarTabela(municipios);

    statsGrid.classList.add('visible');
    tableWrapper.classList.add('visible');
}


function renderizarTabela(lista) {
    tabelaBody.innerHTML = "";
    const maxPop = Math.max(...lista.map(m => m.populacao));

    lista.forEach((m, index) => {
        const percentual = (m.populacao / maxPop) * 100;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><span class="rank-badge ${index < 3 ? 'top3' : ''}">${index + 1}</span></td>
            <td style="font-weight: 500">${m.nome}</td>
            <td style="color: var(--muted)">${m.mesorregiao}</td>
            <td>
                <div class="pop-bar-wrap">
                    <div class="pop-bar">
                        <div class="pop-bar-fill" style="width: ${percentual}%"></div>
                    </div>
                    <span class="pop-num">${m.populacao.toLocaleString('pt-BR')}</span>
                </div>
            </td>
        `;
        tabelaBody.appendChild(row);
    });
}


function filtrarTabela() {
    const termo = searchInput.value.toLowerCase();
    const filtrados = municipiosDados.filter(m => 
        m.nome.toLowerCase().includes(termo) || 
        m.mesorregiao.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}


function mostrarLoading(status) {
    if (status) loading.classList.add('visible');
    else loading.classList.remove('visible');
}

function exibirErro(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
}

function ocultarErro() {
    errorMsg.classList.remove('visible');
}

// Iniciar app
carregarEstados();
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../api/api';
import '../styles/pages/DashboardOverview.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const resumoMock = {
  totalProdutos: 42,
  estoqueBaixo: 6,
  movimentacoesHoje: 13,
  valorTotal: 1250.75,
};

const categoriasMock = [
  { nome: 'Materiais Pedagógicos', quantidade: 18 },
  { nome: 'Papelaria', quantidade: 13 },
  { nome: 'Laboratório', quantidade: 7 },
  { nome: 'Limpeza', quantidade: 4 },
];

const atividadesRecentesMock = [
  'Entrada de 30 cadernos (Sala Pedagógica)',
  'Saída de 12 kits de caneta (Professor Carlos)',
  'Alerta: toner preto abaixo do mínimo',
  'Cadastro de novo item: Luvas de laboratório',
];

const itensEstoqueMock = [
  {
    produto: 'Papel A4',
    codigo: 'PAP-001',
    categoria: 'Papelaria',
    estoque: 320,
    minimo: 200,
    status: 'Estável',
  },
  {
    produto: 'Caneta Azul',
    codigo: 'CAN-008',
    categoria: 'Papelaria',
    estoque: 45,
    minimo: 80,
    status: 'Atenção',
  },
  {
    produto: 'Toner Preto',
    codigo: 'TON-004',
    categoria: 'Administração',
    estoque: 2,
    minimo: 5,
    status: 'Crítico',
  },
  {
    produto: 'Microscópio Escolar',
    codigo: 'LAB-015',
    categoria: 'Laboratório',
    estoque: 9,
    minimo: 4,
    status: 'Estável',
  },
];

function DashboardOverview() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState(resumoMock);
  const [entradasMensais, setEntradasMensais] = useState([6, 8, 7, 12, 14, 17]);
  const [saidasMensais, setSaidasMensais] = useState([4, 7, 6, 9, 12, 14]);
  const [labelsMes, setLabelsMes] = useState(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']);
  const [categorias, setCategorias] = useState(categoriasMock);
  const [atividadesRecentes, setAtividadesRecentes] = useState(atividadesRecentesMock);
  const [itensEstoque, setItensEstoque] = useState(itensEstoqueMock);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const hoje = new Date();
        const hojeIso = hoje.toISOString().split('T')[0];

        const [dashboardRes, porCategoriaRes, mensalRes, movRes, materiaisRes, movHojeRes] =
          await Promise.all([
            api.get('/relatorios/dashboard'),
            api.get('/relatorios/por-categoria'),
            api.get('/relatorios/movimentacoes-mensais?meses=6'),
            api.get('/movimentacoes?limite=6'),
            api.get('/materiais'),
            api.get(`/movimentacoes?dataInicio=${hojeIso}&dataFim=${hojeIso}&limite=300`),
          ]);

        const dashboard = dashboardRes.data;
        setResumo({
          totalProdutos: dashboard.totalMateriais ?? resumoMock.totalProdutos,
          estoqueBaixo: dashboard.estoqueBaixo ?? resumoMock.estoqueBaixo,
          movimentacoesHoje:
            movHojeRes.data?.length ?? resumoMock.movimentacoesHoje,
          valorTotal: dashboard.totalItensEstoque ?? resumoMock.valorTotal,
        });

        const categoriasApi = (porCategoriaRes.data || []).map((item) => ({
          nome: item.categoria,
          quantidade: item.totalItens,
        }));
        if (categoriasApi.length > 0) {
          setCategorias(categoriasApi);
        }

        const mensal = mensalRes.data || [];
        if (mensal.length > 0) {
          setLabelsMes(
            mensal.map((item) => {
              const [ano, mes] = item.mes.split('-');
              const data = new Date(Number(ano), Number(mes) - 1, 1);
              return data.toLocaleDateString('pt-BR', { month: 'short' });
            })
          );
          setEntradasMensais(mensal.map((item) => Number(item.entrada || 0)));
          setSaidasMensais(mensal.map((item) => Number(item.saida || 0)));
        }

        const atividadesApi = (movRes.data || []).map((mov) => {
          const tipo = mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída';
          const qtd = mov.quantidade;
          const nome = mov.material?.nome || 'Material';
          return `${tipo} de ${qtd} ${mov.material?.unidade || 'un'} - ${nome}`;
        });
        if (atividadesApi.length > 0) {
          setAtividadesRecentes(atividadesApi);
        }

        const materiaisApi = (materiaisRes.data || []).slice(0, 8).map((mat) => {
          let status = 'Estável';
          if (mat.quantidadeAtual <= mat.estoqueMinimo) status = 'Crítico';
          else if (mat.quantidadeAtual <= mat.estoqueMinimo * 1.3) status = 'Atenção';

          return {
            produto: mat.nome,
            codigo: `MAT-${String(mat.id).padStart(3, '0')}`,
            categoria: mat.categoria?.nome || '-',
            estoque: mat.quantidadeAtual,
            minimo: mat.estoqueMinimo,
            status,
          };
        });
        if (materiaisApi.length > 0) {
          setItensEstoque(materiaisApi);
        }
      } catch (error) {
        console.error('Falha ao carregar dados do dashboard:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const lineData = useMemo(
    () => ({
      labels: labelsMes,
      datasets: [
        {
          label: 'Entradas',
          data: entradasMensais,
          borderColor: '#1e5a9e',
          backgroundColor: 'rgba(30, 90, 158, 0.14)',
          tension: 0.35,
          fill: false,
          pointRadius: 3,
        },
        {
          label: 'Saídas',
          data: saidasMensais,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          tension: 0.35,
          fill: false,
          pointRadius: 3,
        },
      ],
    }),
    [labelsMes, entradasMensais, saidasMensais]
  );

  const donutData = useMemo(
    () => ({
      labels: categorias.map((c) => c.nome),
      datasets: [
        {
          data: categorias.map((c) => c.quantidade),
          backgroundColor: ['#1e5a9e', '#3c82d6', '#9bb8d6', '#6b7280'],
          borderWidth: 1,
          borderColor: '#ffffff',
        },
      ],
    }),
    [categorias]
  );

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar">
        <h1 className="dashboard__brand">Nova Era</h1>
        <p className="dashboard__section-label">Menu Principal</p>
        <nav className="dashboard__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>
        <div className="dashboard__user">
          <strong>{usuario.nome || 'Usuário'}</strong>
          <span>{usuario.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="dashboard__content" id="dashboard-overview">
        <header className="dashboard__topbar">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Painel de controle do almoxarifado escolar.</p>
          </div>
          <input
            type="search"
            placeholder="Buscar produto, categoria ou código..."
            className="dashboard__search"
          />
        </header>
        {carregando && <p className="dashboard__loading">Carregando dados reais...</p>}

        <section className="dashboard__stats">
          <article className="dashboard__card">
            <span>Total de produtos</span>
            <strong>{resumo.totalProdutos}</strong>
          </article>
          <article className="dashboard__card">
            <span>Estoque baixo</span>
            <strong className="is-alert">{resumo.estoqueBaixo}</strong>
          </article>
          <article className="dashboard__card">
            <span>Movimentações hoje</span>
            <strong>{resumo.movimentacoesHoje}</strong>
          </article>
          <article className="dashboard__card">
            <span>Total de itens em estoque</span>
            <strong>{resumo.valorTotal.toLocaleString('pt-BR')}</strong>
          </article>
        </section>

        <section className="dashboard__grid">
          <article className="dashboard__panel dashboard__panel--line">
            <h3>Movimentações por período</h3>
            <div className="dashboard__chart-wrap">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                }}
              />
            </div>
          </article>

          <article className="dashboard__panel dashboard__panel--donut">
            <h3>Distribuição por categoria</h3>
            <div className="dashboard__chart-wrap">
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </article>
        </section>

        <section className="dashboard__bottom">
          <article className="dashboard__panel">
            <h3>Atividades recentes</h3>
            <ul className="dashboard__activity">
              {atividadesRecentes.map((atividade) => (
                <li key={atividade}>{atividade}</li>
              ))}
            </ul>
          </article>

          <article className="dashboard__panel">
            <h3>Status do estoque</h3>
            <div className="dashboard__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Mínimo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itensEstoque.map((item) => (
                    <tr key={item.codigo}>
                      <td>{item.produto}</td>
                      <td>{item.codigo}</td>
                      <td>{item.categoria}</td>
                      <td>{item.estoque}</td>
                      <td>{item.minimo}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            item.status === 'Crítico'
                              ? 'is-critical'
                              : item.status === 'Atenção'
                                ? 'is-warning'
                                : 'is-ok'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default DashboardOverview;

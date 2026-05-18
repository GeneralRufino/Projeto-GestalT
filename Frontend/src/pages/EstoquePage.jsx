import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/pages/EstoquePage.css';

function EstoquePage() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();

  const [materiais, setMateriais] = useState([]);
  const [categoriasResumo, setCategoriasResumo] = useState([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
  const [semGiro, setSemGiro] = useState([]);
  const [ultimasMovs, setUltimasMovs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [somenteBaixo, setSomenteBaixo] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    setErro('');
    try {
      const [materiaisRes, categoriasRes, baixoRes, movsRes, semGiroRes] = await Promise.all([
        api.get('/materiais', {
          params: {
            busca: busca || undefined,
            categoriaId: categoriaId || undefined,
            estoqueBaixo: somenteBaixo ? 'true' : undefined,
          },
        }),
        api.get('/relatorios/por-categoria'),
        api.get('/relatorios/estoque-baixo'),
        api.get('/movimentacoes', { params: { limite: 400 } }),
        api.get('/relatorios/sem-giro', { params: { meses: 6 } }),
      ]);

      setMateriais(materiaisRes.data || []);
      setCategoriasResumo(categoriasRes.data || []);
      setEstoqueBaixo(baixoRes.data || []);
      setUltimasMovs(movsRes.data || []);
      setSemGiro(semGiroRes.data || []);
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          'Falha ao carregar o módulo de estoque. Verifique a API.'
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoriasFiltro = useMemo(() => {
    const mapa = new Map();
    materiais.forEach((m) => {
      if (m.categoria?.id && m.categoria?.nome) {
        mapa.set(m.categoria.id, m.categoria.nome);
      }
    });
    return Array.from(mapa.entries()).map(([id, nome]) => ({ id, nome }));
  }, [materiais]);

  const metricas = useMemo(() => {
    const totalItens = materiais.reduce((acc, m) => acc + m.quantidadeAtual, 0);
    const totalProdutos = materiais.length;
    const emBaixa = materiais.filter((m) => m.quantidadeAtual <= m.estoqueMinimo).length;
    return { totalItens, totalProdutos, emBaixa };
  }, [materiais]);

  const ultMovPorMaterial = useMemo(() => {
    const mapa = new Map();
    ultimasMovs.forEach((mov) => {
      if (!mov.materialId || !mov.data) return;
      const atual = mapa.get(mov.materialId);
      const dataNova = new Date(mov.data);
      if (!atual || dataNova > atual) mapa.set(mov.materialId, dataNova);
    });
    return mapa;
  }, [ultimasMovs]);

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  const baixarCsv = async (rota, nomeArquivo) => {
    try {
      const resposta = await api.get(rota, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resposta.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeArquivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Falha ao exportar CSV.');
    }
  };

  return (
    <div className="estoque-layout">
      <aside className="estoque-layout__sidebar">
        <h1 className="estoque-layout__brand">Nova Era</h1>
        <p className="estoque-layout__label">Menu Principal</p>
        <nav className="estoque-layout__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>

        <div className="estoque-layout__user">
          <strong>{usuario.nome || 'Usuário'}</strong>
          <span>{usuario.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="estoque-layout__content">
        <header className="estoque-layout__header">
          <h2>Gestão de Estoque</h2>
          <p>Controle de níveis atuais, alerta de mínimo e visão consolidada por categoria.</p>
        </header>

        {erro && <Alert variant="danger">{erro}</Alert>}

        <section className="estoque-layout__metricas">
          <article>
            <span>Produtos ativos</span>
            <strong>{metricas.totalProdutos}</strong>
          </article>
          <article>
            <span>Itens em estoque</span>
            <strong>{metricas.totalItens.toLocaleString('pt-BR')}</strong>
          </article>
          <article>
            <span>Estoque baixo</span>
            <strong className="is-alert">{metricas.emBaixa}</strong>
          </article>
        </section>

        <section className="estoque-layout__filtros">
          <Form.Control
            placeholder="Buscar material..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Form.Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categoriasFiltro.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </Form.Select>
          <Form.Check
            type="switch"
            id="somente-baixo"
            label="Somente itens em baixa"
            checked={somenteBaixo}
            onChange={(e) => setSomenteBaixo(e.target.checked)}
          />
          <Button variant="outline-primary" onClick={carregarDados}>
            Aplicar filtros
          </Button>
          <Button
            variant="outline-success"
            onClick={() => baixarCsv('/relatorios/exportar/estoque.csv', 'estoque.csv')}
          >
            Exportar estoque CSV
          </Button>
          <Button
            variant="outline-success"
            onClick={() =>
              baixarCsv('/relatorios/exportar/movimentacoes.csv', 'movimentacoes.csv')
            }
          >
            Exportar movimentações CSV
          </Button>
        </section>

        <section className="estoque-layout__painel-duplo">
          <article className="estoque-layout__panel">
            <h3>Alertas de estoque baixo</h3>
            {carregando ? (
              <div className="estoque-layout__loading">
                <Spinner size="sm" animation="border" />
                <span>Carregando alertas...</span>
              </div>
            ) : estoqueBaixo.length === 0 ? (
              <p className="text-muted">Nenhum item abaixo do mínimo no momento.</p>
            ) : (
              <ul className="estoque-layout__lista-alertas">
                {estoqueBaixo.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <strong>{item.nome}</strong>
                    <span>
                      Atual: {item.quantidadeAtual} | Mínimo: {item.estoqueMinimo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="estoque-layout__panel">
            <h3>Resumo por categoria</h3>
            <div className="estoque-layout__categoria-lista">
              {categoriasResumo.map((cat) => (
                <div key={cat.categoria} className="estoque-layout__categoria-item">
                  <strong>{cat.categoria}</strong>
                  <span>{cat.totalMateriais} produtos</span>
                  <Badge bg="secondary">{cat.totalItens} itens</Badge>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="estoque-layout__panel">
          <h3>Itens sem giro (6 meses)</h3>
          {carregando ? (
            <div className="estoque-layout__loading">
              <Spinner size="sm" animation="border" />
              <span>Carregando itens sem giro...</span>
            </div>
          ) : semGiro.length === 0 ? (
            <p className="text-muted">Nenhum item sem movimentação no período.</p>
          ) : (
            <ul className="estoque-layout__lista-alertas">
              {semGiro.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <strong>{item.nome}</strong>
                  <span>
                    Categoria: {item.categoria} | Estoque: {item.quantidadeAtual}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="estoque-layout__panel">
          <h3>Posição atual dos materiais</h3>
          {carregando ? (
            <div className="estoque-layout__loading">
              <Spinner size="sm" animation="border" />
              <span>Carregando posição de estoque...</span>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Categoria</th>
                  <th>Atual</th>
                  <th>Mínimo</th>
                  <th>Última Movimentação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {materiais.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Nenhum material encontrado.
                    </td>
                  </tr>
                ) : (
                  materiais.map((mat) => {
                    const critica = mat.quantidadeAtual <= mat.estoqueMinimo;
                    const atencao =
                      !critica && mat.quantidadeAtual <= Math.round(mat.estoqueMinimo * 1.3);
                    const status = critica ? 'Crítico' : atencao ? 'Atenção' : 'Estável';
                    const badge = critica ? 'danger' : atencao ? 'warning' : 'success';
                    const dataUltMov = ultMovPorMaterial.get(mat.id);
                    return (
                      <tr key={mat.id}>
                        <td>{mat.nome}</td>
                        <td>{mat.categoria?.nome || '-'}</td>
                        <td>{mat.quantidadeAtual}</td>
                        <td>{mat.estoqueMinimo}</td>
                        <td>
                          {dataUltMov
                            ? dataUltMov.toLocaleString('pt-BR')
                            : 'Sem movimentação recente'}
                        </td>
                        <td>
                          <Badge bg={badge}>{status}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </section>
      </main>
    </div>
  );
}

export default EstoquePage;

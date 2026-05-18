import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/pages/MovimentacaoPage.css';

const estadoInicialLancamento = {
  tipo: 'ENTRADA',
  materialId: '',
  quantidade: 1,
  observacao: '',
};

function MovimentacaoPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();

  const [materiais, setMateriais] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [lancamento, setLancamento] = useState(estadoInicialLancamento);
  const [filtros, setFiltros] = useState({
    tipo: '',
    materialId: '',
    dataInicio: '',
    dataFim: '',
  });

  const carregarMateriais = async () => {
    const res = await api.get('/materiais');
    setMateriais(res.data || []);
  };

  const carregarMovimentacoes = async (filtroAtual = filtros) => {
    const params = {
      tipo: filtroAtual.tipo || undefined,
      materialId: filtroAtual.materialId || undefined,
      dataInicio: filtroAtual.dataInicio || undefined,
      dataFim: filtroAtual.dataFim || undefined,
      limite: 100,
    };
    const res = await api.get('/movimentacoes', { params });
    setMovimentacoes(res.data || []);
  };

  const carregarDados = async () => {
    setCarregando(true);
    setErro('');
    try {
      await Promise.all([carregarMateriais(), carregarMovimentacoes()]);
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          'Falha ao carregar movimentações. Verifique o backend.'
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

  const metricas = useMemo(() => {
    const entradas = movimentacoes.filter((m) => m.tipo === 'ENTRADA').length;
    const saidas = movimentacoes.filter((m) => m.tipo === 'SAIDA').length;
    const totalMov = movimentacoes.length;
    return { entradas, saidas, totalMov };
  }, [movimentacoes]);

  const onChangeLancamento = (campo, valor) => {
    setLancamento((prev) => ({ ...prev, [campo]: valor }));
  };

  const onChangeFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = async () => {
    setErro('');
    setSucesso('');
    try {
      setCarregando(true);
      await carregarMovimentacoes(filtros);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível filtrar.');
    } finally {
      setCarregando(false);
    }
  };

  const registrarMovimentacao = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const endpoint =
        lancamento.tipo === 'ENTRADA' ? '/movimentacoes/entrada' : '/movimentacoes/saida';
      await api.post(endpoint, {
        materialId: Number(lancamento.materialId),
        quantidade: Number(lancamento.quantidade),
        observacao: lancamento.observacao?.trim() || null,
      });
      setSucesso(
        `${lancamento.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada com sucesso.`
      );
      setLancamento((prev) => ({
        ...estadoInicialLancamento,
        tipo: prev.tipo,
      }));
      await Promise.all([carregarMateriais(), carregarMovimentacoes()]);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Falha ao registrar movimentação.');
    } finally {
      setSalvando(false);
    }
  };

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="mov-layout">
      <aside className="mov-layout__sidebar">
        <h1 className="mov-layout__brand">Nova Era</h1>
        <p className="mov-layout__label">Menu Principal</p>
        <nav className="mov-layout__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>

        <div className="mov-layout__user">
          <strong>{usuario.nome || 'Usuário'}</strong>
          <span>{usuario.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="mov-layout__content">
        <header className="mov-layout__header">
          <h2>Movimentação de Estoque</h2>
          <p>Registre entradas e saídas com rastreabilidade completa.</p>
        </header>

        {erro && <Alert variant="danger">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className="mov-layout__metricas">
          <article>
            <span>Total no histórico</span>
            <strong>{metricas.totalMov}</strong>
          </article>
          <article>
            <span>Entradas</span>
            <strong className="is-entry">{metricas.entradas}</strong>
          </article>
          <article>
            <span>Saídas</span>
            <strong className="is-exit">{metricas.saidas}</strong>
          </article>
        </section>

        <section className="mov-layout__panel">
          <h3>Novo lançamento</h3>
          <Form onSubmit={registrarMovimentacao}>
            <div className="mov-layout__form-grid">
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={lancamento.tipo}
                  onChange={(e) => onChangeLancamento('tipo', e.target.value)}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Material</Form.Label>
                <Form.Select
                  required
                  value={lancamento.materialId}
                  onChange={(e) => onChangeLancamento('materialId', e.target.value)}
                >
                  <option value="">Selecione um material</option>
                  {materiais.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.nome} (Estoque: {mat.quantidadeAtual})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Quantidade</Form.Label>
                <Form.Control
                  required
                  type="number"
                  min={1}
                  value={lancamento.quantidade}
                  onChange={(e) => onChangeLancamento('quantidade', e.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Observação</Form.Label>
                <Form.Control
                  value={lancamento.observacao}
                  onChange={(e) => onChangeLancamento('observacao', e.target.value)}
                  placeholder="Motivo, setor, destinatário..."
                />
              </Form.Group>
            </div>

            <div className="mt-3">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Registrar movimentação'}
              </Button>
            </div>
          </Form>
        </section>

        <section className="mov-layout__panel">
          <h3>Filtros do histórico</h3>
          <div className="mov-layout__filtros">
            <Form.Select value={filtros.tipo} onChange={(e) => onChangeFiltro('tipo', e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </Form.Select>

            <Form.Select
              value={filtros.materialId}
              onChange={(e) => onChangeFiltro('materialId', e.target.value)}
            >
              <option value="">Todos os materiais</option>
              {materiais.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nome}
                </option>
              ))}
            </Form.Select>

            <Form.Control
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => onChangeFiltro('dataInicio', e.target.value)}
            />
            <Form.Control
              type="date"
              value={filtros.dataFim}
              onChange={(e) => onChangeFiltro('dataFim', e.target.value)}
            />

            <Button variant="outline-primary" onClick={aplicarFiltros}>
              Aplicar
            </Button>
          </div>
        </section>

        <section className="mov-layout__panel">
          <h3>Histórico de movimentações</h3>
          {carregando ? (
            <div className="mov-layout__loading">
              <Spinner animation="border" size="sm" />
              <span>Carregando histórico...</span>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Material</th>
                  <th>Quantidade</th>
                  <th>Usuário</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Nenhuma movimentação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.data).toLocaleString('pt-BR')}</td>
                      <td>
                        <Badge bg={mov.tipo === 'ENTRADA' ? 'success' : 'warning'} text="dark">
                          {mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </td>
                      <td>{mov.material?.nome || '-'}</td>
                      <td>{mov.quantidade}</td>
                      <td>{mov.usuario?.nome || '-'}</td>
                      <td>{mov.observacao || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </section>
      </main>
    </div>
  );
}

export default MovimentacaoPage;

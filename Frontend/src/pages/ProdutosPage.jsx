import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/pages/ProdutosPage.css';

const estadoInicialFormulario = {
  nome: '',
  descricao: '',
  unidade: '',
  quantidadeAtual: 0,
  estoqueMinimo: 10,
  categoriaId: '',
};

function ProdutosPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();

  const [materiais, setMateriais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [somenteEstoqueBaixo, setSomenteEstoqueBaixo] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialFormulario);

  const carregarDados = async () => {
    setCarregando(true);
    setErro('');
    try {
      const [materiaisRes, categoriasRes] = await Promise.all([
        api.get('/materiais', {
          params: {
            busca: busca || undefined,
            categoriaId: categoriaFiltro || undefined,
            estoqueBaixo: somenteEstoqueBaixo ? 'true' : undefined,
          },
        }),
        api.get('/categorias'),
      ]);

      setMateriais(materiaisRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          'Falha ao carregar produtos. Verifique se o backend está rodando.'
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
    const total = materiais.length;
    const estoqueBaixo = materiais.filter(
      (m) => m.quantidadeAtual <= m.estoqueMinimo
    ).length;
    const totalItens = materiais.reduce((acc, m) => acc + m.quantidadeAtual, 0);
    return { total, estoqueBaixo, totalItens };
  }, [materiais]);

  const abrirCriacao = () => {
    setEditandoId(null);
    setForm(estadoInicialFormulario);
    setShowModal(true);
  };

  const abrirEdicao = (material) => {
    setEditandoId(material.id);
    setForm({
      nome: material.nome || '',
      descricao: material.descricao || '',
      unidade: material.unidade || '',
      quantidadeAtual: material.quantidadeAtual ?? 0,
      estoqueMinimo: material.estoqueMinimo ?? 10,
      categoriaId: material.categoriaId ? String(material.categoriaId) : '',
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setShowModal(false);
  };

  const onChangeForm = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const salvarMaterial = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || null,
        unidade: form.unidade.trim(),
        quantidadeAtual: Number(form.quantidadeAtual),
        estoqueMinimo: Number(form.estoqueMinimo),
        categoriaId: Number(form.categoriaId),
      };

      if (editandoId) {
        await api.put(`/materiais/${editandoId}`, payload);
      } else {
        await api.post('/materiais', payload);
      }

      setShowModal(false);
      await carregarDados();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  };

  const inativarMaterial = async (material) => {
    const confirmar = window.confirm(
      `Deseja inativar o item "${material.nome}"? Esta ação remove o item da listagem ativa.`
    );
    if (!confirmar) return;
    setErro('');
    try {
      await api.delete(`/materiais/${material.id}`);
      await carregarDados();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível inativar o item.');
    }
  };

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="produtos-layout">
      <aside className="produtos-layout__sidebar">
        <h1 className="produtos-layout__brand">Nova Era</h1>
        <p className="produtos-layout__label">Menu Principal</p>
        <nav className="produtos-layout__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>

        <div className="produtos-layout__user">
          <strong>{usuario.nome || 'Usuário'}</strong>
          <span>{usuario.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="produtos-layout__content">
        <header className="produtos-layout__header">
          <div>
            <h2>Produtos</h2>
            <p>Cadastro e gestão de itens do almoxarifado escolar.</p>
          </div>
          <Button variant="primary" onClick={abrirCriacao}>
            + Novo Produto
          </Button>
        </header>

        {erro && <Alert variant="danger">{erro}</Alert>}

        <section className="produtos-layout__metricas">
          <article>
            <span>Total de produtos</span>
            <strong>{metricas.total}</strong>
          </article>
          <article>
            <span>Estoque baixo</span>
            <strong className="is-alert">{metricas.estoqueBaixo}</strong>
          </article>
          <article>
            <span>Total de itens em estoque</span>
            <strong>{metricas.totalItens.toLocaleString('pt-BR')}</strong>
          </article>
        </section>

        <section className="produtos-layout__filtros">
          <Form.Control
            placeholder="Buscar por nome ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Form.Select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </Form.Select>
          <Form.Check
            type="switch"
            id="estoque-baixo-switch"
            label="Somente estoque baixo"
            checked={somenteEstoqueBaixo}
            onChange={(e) => setSomenteEstoqueBaixo(e.target.checked)}
          />
          <Button variant="outline-primary" onClick={carregarDados}>
            Aplicar filtros
          </Button>
        </section>

        <section className="produtos-layout__tabela">
          {carregando ? (
            <div className="produtos-layout__loading">
              <Spinner animation="border" size="sm" />
              <span>Carregando produtos...</span>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Unidade</th>
                  <th>Estoque Atual</th>
                  <th>Estoque Mínimo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {materiais.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Nenhum produto encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  materiais.map((mat) => {
                    const critico = mat.quantidadeAtual <= mat.estoqueMinimo;
                    const atencao =
                      !critico && mat.quantidadeAtual <= Math.round(mat.estoqueMinimo * 1.3);
                    const status = critico ? 'Crítico' : atencao ? 'Atenção' : 'Estável';
                    const variant = critico
                      ? 'danger'
                      : atencao
                        ? 'warning'
                        : 'success';
                    return (
                      <tr key={mat.id}>
                        <td>
                          <strong>{mat.nome}</strong>
                          {mat.descricao ? <div className="text-muted">{mat.descricao}</div> : null}
                        </td>
                        <td>{mat.categoria?.nome || '-'}</td>
                        <td>{mat.unidade}</td>
                        <td>{mat.quantidadeAtual}</td>
                        <td>{mat.estoqueMinimo}</td>
                        <td>
                          <Badge bg={variant}>{status}</Badge>
                        </td>
                        <td className="produtos-layout__acoes">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => abrirEdicao(mat)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => inativarMaterial(mat)}
                          >
                            Inativar
                          </Button>
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

      <Modal show={showModal} onHide={fecharModal} centered>
        <Form onSubmit={salvarMaterial}>
          <Modal.Header closeButton>
            <Modal.Title>{editandoId ? 'Editar produto' : 'Novo produto'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                required
                value={form.nome}
                onChange={(e) => onChangeForm('nome', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                value={form.descricao}
                onChange={(e) => onChangeForm('descricao', e.target.value)}
              />
            </Form.Group>

            <div className="produtos-layout__form-grid">
              <Form.Group>
                <Form.Label>Unidade</Form.Label>
                <Form.Control
                  required
                  value={form.unidade}
                  onChange={(e) => onChangeForm('unidade', e.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Categoria</Form.Label>
                <Form.Select
                  required
                  value={form.categoriaId}
                  onChange={(e) => onChangeForm('categoriaId', e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Estoque atual</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={form.quantidadeAtual}
                  onChange={(e) => onChangeForm('quantidadeAtual', e.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Estoque mínimo</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={form.estoqueMinimo}
                  onChange={(e) => onChangeForm('estoqueMinimo', e.target.value)}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={fecharModal} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ProdutosPage;

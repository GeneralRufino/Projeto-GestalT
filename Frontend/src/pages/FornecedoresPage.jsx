import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/pages/FornecedoresPage.css';

const estadoInicialForm = {
  nome: '',
  email: '',
  telefone: '',
  contato: '',
  observacao: '',
  ativo: true,
};

function FornecedoresPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();

  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [busca, setBusca] = useState('');
  const [somenteAtivos, setSomenteAtivos] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialForm);

  const carregarFornecedores = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await api.get('/fornecedores', {
        params: {
          busca: busca || undefined,
          ativo: somenteAtivos ? 'true' : undefined,
        },
      });
      setFornecedores(res.data || []);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Falha ao carregar fornecedores.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarFornecedores();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metricas = useMemo(() => {
    const total = fornecedores.length;
    const ativos = fornecedores.filter((f) => f.ativo).length;
    const comEmail = fornecedores.filter((f) => f.email).length;
    return { total, ativos, comEmail };
  }, [fornecedores]);

  const abrirCriacao = () => {
    setEditandoId(null);
    setForm(estadoInicialForm);
    setShowModal(true);
  };

  const abrirEdicao = (f) => {
    setEditandoId(f.id);
    setForm({
      nome: f.nome || '',
      email: f.email || '',
      telefone: f.telefone || '',
      contato: f.contato || '',
      observacao: f.observacao || '',
      ativo: Boolean(f.ativo),
    });
    setShowModal(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        contato: form.contato.trim() || null,
        observacao: form.observacao.trim() || null,
      };

      if (editandoId) {
        payload.ativo = form.ativo;
        await api.put(`/fornecedores/${editandoId}`, payload);
        setSucesso('Fornecedor atualizado com sucesso.');
      } else {
        await api.post('/fornecedores', payload);
        setSucesso('Fornecedor cadastrado com sucesso.');
      }

      setShowModal(false);
      await carregarFornecedores();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const inativar = async (f) => {
    const confirmar = window.confirm(`Deseja inativar o fornecedor "${f.nome}"?`);
    if (!confirmar) return;
    setErro('');
    setSucesso('');
    try {
      await api.delete(`/fornecedores/${f.id}`);
      setSucesso('Fornecedor inativado com sucesso.');
      await carregarFornecedores();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível inativar.');
    }
  };

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="for-layout">
      <aside className="for-layout__sidebar">
        <h1 className="for-layout__brand">Nova Era</h1>
        <p className="for-layout__label">Menu Principal</p>
        <nav className="for-layout__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>

        <div className="for-layout__user">
          <strong>{usuario.nome || 'Usuário'}</strong>
          <span>{usuario.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="for-layout__content">
        <header className="for-layout__header">
          <div>
            <h2>Fornecedores</h2>
            <p>Cadastro e gestão dos parceiros de abastecimento do almoxarifado.</p>
          </div>
          <Button onClick={abrirCriacao}>+ Novo Fornecedor</Button>
        </header>

        {erro && <Alert variant="danger">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className="for-layout__metricas">
          <article>
            <span>Total</span>
            <strong>{metricas.total}</strong>
          </article>
          <article>
            <span>Ativos</span>
            <strong>{metricas.ativos}</strong>
          </article>
          <article>
            <span>Com e-mail</span>
            <strong>{metricas.comEmail}</strong>
          </article>
        </section>

        <section className="for-layout__filtros">
          <Form.Control
            placeholder="Buscar por nome, contato, e-mail ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Form.Check
            type="switch"
            id="fornecedores-ativos"
            label="Somente ativos"
            checked={somenteAtivos}
            onChange={(e) => setSomenteAtivos(e.target.checked)}
          />
          <Button variant="outline-primary" onClick={carregarFornecedores}>
            Aplicar filtros
          </Button>
        </section>

        <section className="for-layout__tabela">
          {carregando ? (
            <div className="for-layout__loading">
              <Spinner animation="border" size="sm" />
              <span>Carregando fornecedores...</span>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                ) : (
                  fornecedores.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.nome}</strong>
                        {f.observacao ? <div className="text-muted">{f.observacao}</div> : null}
                      </td>
                      <td>{f.contato || '-'}</td>
                      <td>{f.email || '-'}</td>
                      <td>{f.telefone || '-'}</td>
                      <td>
                        <Badge bg={f.ativo ? 'success' : 'danger'}>
                          {f.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="for-layout__acoes">
                        <Button size="sm" variant="outline-primary" onClick={() => abrirEdicao(f)}>
                          Editar
                        </Button>
                        {f.ativo && (
                          <Button size="sm" variant="outline-danger" onClick={() => inativar(f)}>
                            Inativar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </section>
      </main>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={salvar}>
          <Modal.Header closeButton>
            <Modal.Title>{editandoId ? 'Editar fornecedor' : 'Novo fornecedor'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                required
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contato</Form.Label>
              <Form.Control
                value={form.contato}
                onChange={(e) => setForm((prev) => ({ ...prev, contato: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                value={form.telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observação</Form.Label>
              <Form.Control
                value={form.observacao}
                onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </Form.Group>
            {editandoId && (
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.ativo ? 'true' : 'false'}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ativo: e.target.value === 'true' }))
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default FornecedoresPage;

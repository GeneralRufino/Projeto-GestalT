import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/pages/ConfiguracoesPage.css';

const estadoInicialForm = {
  nome: '',
  email: '',
  perfil: 'OPERADOR',
  senha: '',
};

function ConfiguracoesPage() {
  const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [acessoNegado, setAcessoNegado] = useState(false);

  const [busca, setBusca] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState('');
  const [somenteAtivos, setSomenteAtivos] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialForm);

  const carregarUsuarios = async () => {
    setCarregando(true);
    setErro('');
    setAcessoNegado(false);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data || []);
    } catch (error) {
      if (error.response?.status === 403) {
        setAcessoNegado(true);
        setUsuarios([]);
      } else {
        setErro(
          error.response?.data?.erro ||
            'Falha ao carregar usuários. Verifique se o backend está ativo.'
        );
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarUsuarios();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusca =
        !busca ||
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase());
      const matchPerfil = !perfilFiltro || u.perfil === perfilFiltro;
      const matchAtivo = !somenteAtivos || u.ativo;
      return matchBusca && matchPerfil && matchAtivo;
    });
  }, [usuarios, busca, perfilFiltro, somenteAtivos]);

  const metricas = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.ativo).length;
    const admins = usuarios.filter((u) => u.perfil === 'ADMIN').length;
    return { total, ativos, admins };
  }, [usuarios]);

  const abrirCriacao = () => {
    setEditandoId(null);
    setForm(estadoInicialForm);
    setShowModal(true);
  };

  const abrirEdicao = (usuario) => {
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome || '',
      email: usuario.email || '',
      perfil: usuario.perfil || 'OPERADOR',
      senha: '',
      ativo: Boolean(usuario.ativo),
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setShowModal(false);
  };

  const atualizarForm = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const salvarUsuario = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        perfil: form.perfil,
      };

      if (form.senha?.trim()) {
        payload.senha = form.senha.trim();
      }

      if (editandoId) {
        payload.ativo = Boolean(form.ativo);
        await api.put(`/usuarios/${editandoId}`, payload);
        setSucesso('Usuário atualizado com sucesso.');
      } else {
        if (!payload.senha) {
          setErro('Senha é obrigatória ao criar novo usuário.');
          setSalvando(false);
          return;
        }
        await api.post('/usuarios', payload);
        setSucesso('Usuário criado com sucesso.');
      }

      setShowModal(false);
      await carregarUsuarios();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível salvar o usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const inativarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `Deseja inativar o usuário "${usuario.nome}"?`
    );
    if (!confirmar) return;
    setErro('');
    setSucesso('');
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      setSucesso('Usuário inativado com sucesso.');
      await carregarUsuarios();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível inativar o usuário.');
    }
  };

  const sair = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="config-layout">
      <aside className="config-layout__sidebar">
        <h1 className="config-layout__brand">Nova Era</h1>
        <p className="config-layout__label">Menu Principal</p>
        <nav className="config-layout__nav">
          <NavLink to="/dashboard" end>
            Dashboard Overview
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/estoque">Estoque</NavLink>
          <NavLink to="/fornecedores">Fornecedores</NavLink>
          <NavLink to="/movimentacao">Movimentação</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>

        <div className="config-layout__user">
          <strong>{usuarioLogado.nome || 'Usuário'}</strong>
          <span>{usuarioLogado.perfil || 'Perfil não definido'}</span>
          <Button variant="outline-danger" size="sm" onClick={sair}>
            Sair do Sistema
          </Button>
        </div>
      </aside>

      <main className="config-layout__content">
        <header className="config-layout__header">
          <div>
            <h2>Configurações e Usuários</h2>
            <p>Gestão de perfis e controle de acesso ao sistema.</p>
          </div>
          {!acessoNegado && (
            <Button variant="primary" onClick={abrirCriacao}>
              + Novo Usuário
            </Button>
          )}
        </header>

        {erro && <Alert variant="danger">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}
        {acessoNegado && (
          <Alert variant="warning">
            Seu perfil não possui permissão de administrador para gerenciar usuários.
          </Alert>
        )}

        {!acessoNegado && (
          <>
            <section className="config-layout__metricas">
              <article>
                <span>Total de usuários</span>
                <strong>{metricas.total}</strong>
              </article>
              <article>
                <span>Usuários ativos</span>
                <strong>{metricas.ativos}</strong>
              </article>
              <article>
                <span>Administradores</span>
                <strong>{metricas.admins}</strong>
              </article>
            </section>

            <section className="config-layout__filtros">
              <Form.Control
                placeholder="Buscar por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Form.Select
                value={perfilFiltro}
                onChange={(e) => setPerfilFiltro(e.target.value)}
              >
                <option value="">Todos os perfis</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OPERADOR">OPERADOR</option>
              </Form.Select>
              <Form.Check
                type="switch"
                id="somente-ativos"
                label="Somente ativos"
                checked={somenteAtivos}
                onChange={(e) => setSomenteAtivos(e.target.checked)}
              />
            </section>

            <section className="config-layout__tabela">
              {carregando ? (
                <div className="config-layout__loading">
                  <Spinner animation="border" size="sm" />
                  <span>Carregando usuários...</span>
                </div>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Perfil</th>
                      <th>Status</th>
                      <th>Criação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Nenhum usuário encontrado para os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((u) => (
                        <tr key={u.id}>
                          <td>{u.nome}</td>
                          <td>{u.email}</td>
                          <td>
                            <Badge bg={u.perfil === 'ADMIN' ? 'primary' : 'secondary'}>
                              {u.perfil}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={u.ativo ? 'success' : 'danger'}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td>{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</td>
                          <td className="config-layout__acoes">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => abrirEdicao(u)}
                            >
                              Editar
                            </Button>
                            {u.ativo && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => inativarUsuario(u)}
                              >
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
          </>
        )}
      </main>

      <Modal show={showModal} onHide={fecharModal} centered>
        <Form onSubmit={salvarUsuario}>
          <Modal.Header closeButton>
            <Modal.Title>{editandoId ? 'Editar usuário' : 'Novo usuário'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                required
                value={form.nome}
                onChange={(e) => atualizarForm('nome', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                required
                type="email"
                value={form.email}
                onChange={(e) => atualizarForm('email', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Perfil</Form.Label>
              <Form.Select
                value={form.perfil}
                onChange={(e) => atualizarForm('perfil', e.target.value)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="OPERADOR">OPERADOR</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editandoId ? 'Nova senha (opcional)' : 'Senha'}
              </Form.Label>
              <Form.Control
                type="password"
                value={form.senha}
                onChange={(e) => atualizarForm('senha', e.target.value)}
                required={!editandoId}
              />
            </Form.Group>

            {editandoId && (
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.ativo ? 'true' : 'false'}
                  onChange={(e) => atualizarForm('ativo', e.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Form.Select>
              </Form.Group>
            )}
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

export default ConfiguracoesPage;

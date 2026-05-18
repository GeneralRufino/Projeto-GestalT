import React, { useState } from 'react';
import { Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import gestaltLogo from '../assets/logo-gestalt.png';
import novaEraLogo from '../assets/logo-nova-era.png';
import '../styles/pages/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: email,
        senha: password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { erro?: string } } };
      console.error('Erro detalhado:', axiosErr.response?.data);
      setError(axiosErr.response?.data?.erro || 'E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden />
      <div className="login-page__bg-overlay" aria-hidden />

      <img
        src={gestaltLogo}
        alt="GestalT"
        className="login-page__gestalt"
      />

      <div className="login-page__inner">
        <img
          src={novaEraLogo}
          alt="Unidade Escolar Nova Era"
          className="login-page__school-logo"
        />

        <Card className="login-page__card shadow-sm">
          <Card.Body>
            <h1 className="login-page__title text-center">Acesso ao sistema Nova Era</h1>
            <p className="login-page__subtitle text-center mb-4">
              Entre com seu e-mail institucional e senha.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3 text-start">
                <Form.Label htmlFor="login-email">E-mail</Form.Label>
                <Form.Control
                  id="login-email"
                  type="email"
                  placeholder="exemplo@escola.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label htmlFor="login-password">Senha</Form.Label>
                <InputGroup>
                  <Form.Control
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="login-page__password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    <i
                      className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                      aria-hidden
                    />
                  </Button>
                </InputGroup>
              </Form.Group>

              <Button type="submit" className="login-page__submit w-100">
                Entrar
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const ProdutosPage = lazy(() => import('./pages/ProdutosPage'));
const MovimentacaoPage = lazy(() => import('./pages/MovimentacaoPage'));
const EstoquePage = lazy(() => import('./pages/EstoquePage'));
const ConfiguracoesPage = lazy(() => import('./pages/ConfiguracoesPage'));
const FornecedoresPage = lazy(() => import('./pages/FornecedoresPage'));

function RotaPrivada({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
        {/* Rota inicial: Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Rota do Painel: Por enquanto vamos criar um componente simples aqui mesmo */}
        <Route
          path="/dashboard"
          element={
            <RotaPrivada>
              <DashboardOverview />
            </RotaPrivada>
          }
        />

        <Route
          path="/produtos"
          element={
            <RotaPrivada>
              <ProdutosPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/estoque"
          element={
            <RotaPrivada>
              <EstoquePage />
            </RotaPrivada>
          }
        />

        <Route
          path="/fornecedores"
          element={
            <RotaPrivada>
              <FornecedoresPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/movimentacao"
          element={
            <RotaPrivada>
              <MovimentacaoPage />
            </RotaPrivada>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <RotaPrivada>
              <ConfiguracoesPage />
            </RotaPrivada>
          }
        />

        {/* Se o usuário digitar qualquer coisa errada, volta pro Login */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
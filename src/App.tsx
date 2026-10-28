import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import { site } from './config';

// GitHub Pages 无 SPA fallback，HashRouter 免配置且刷新子路由不 404
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {site.features.blog && <Route path="blog" element={<BlogList />} />}
          {site.features.blog && <Route path="blog/:slug" element={<BlogPost />} />}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

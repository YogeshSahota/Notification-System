import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NotificationList from './pages/NotificationList'
import NotificationDetail from './pages/NotificationDetail'
import NewNotification from './pages/NewNotification'
import TemplateManager from './pages/TemplateManager'
import RecipientList from './pages/RecipientList'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notifications" element={<NotificationList />} />
        <Route path="/notifications/new" element={<NewNotification />} />
        <Route path="/notifications/:id" element={<NotificationDetail />} />
        <Route path="/templates" element={<TemplateManager />} />
        <Route path="/recipients" element={<RecipientList />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

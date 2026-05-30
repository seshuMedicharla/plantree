import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './AppShell'
import { RequireAdmin, RequireAuth } from './RequireAuth'
import Admin from '../pages/Admin'
import Auth from '../pages/Auth'
import Home from '../pages/Home'
import Plant from '../pages/Plant'
import Post from '../pages/Post'
import Reels from '../pages/Reels'
import Chat from '../pages/Chat'
import Leaderboards from '../pages/Leaderboards'
import Badges from '../pages/Badges'
import MapZones from '../pages/MapZones'
import Profile from '../pages/Profile'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="plant" element={<Plant />} />
          <Route path="post" element={<Post />} />
          <Route path="reels" element={<Reels />} />
          <Route path="chat" element={<Chat />} />
          <Route path="leaderboards" element={<Leaderboards />} />
          <Route path="badges" element={<Badges />} />
          <Route path="zones" element={<MapZones />} />
          <Route path="profile" element={<Profile />} />

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

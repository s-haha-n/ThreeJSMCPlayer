import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  
  const [worldId, setWorldId] = useState("");
  const navigate = useNavigate();
  
  const enterWorld = () => {
    console.log("Entering world " + worldId);
    navigate('/world', { state: { peerId:worldId }});
  }

  const createWorld = () => {
    console.log("Creating new world");
    navigate('/world', { state: { peerId:'null' }});
  }

  return (
    <div className='SessionHandler'>
      <div className='JoinSession'>
        <label>
          <input value={worldId} onChange={e => setWorldId(e.target.value)} /> <button onClick={enterWorld}>Join World</button>
        </label>
      </div>
      <div className='NewWorld'>
        <button onClick={createWorld}>Create World</button>
      </div>
    </div>
  );
}
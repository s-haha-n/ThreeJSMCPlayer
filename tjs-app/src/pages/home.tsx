import { useState } from 'react';

export default function HomePage() {
  
  const [worldId, setWorldId] = useState("");
  
  const enterWorld = () => {
    console.log("Entering world " + worldId);
  }

  const createWorld = () => {
    console.log("Creating new world");
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
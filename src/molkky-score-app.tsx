import React, { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'molkkyScores';

const MolkkyScoreApp = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editTeamIndex, setEditTeamIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ローディング状態を追加

  // LocalStorageからデータを読み込む
  useEffect(() => {
    const savedTeams = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTeams) {
      try {
        let teams = JSON.parse(savedTeams) as Team[];
        // console.log("Loaded teams:", teams); // デバッグ用
        setTeams(teams);  
      } catch (error) {
        console.error("Failed to parse teams from localStorage:", error);
      }
    }
    setIsLoading(false); // データ読み込み完了後にローディング状態を解除
  }, []);

  // データが更新されたらLocalStorageに保存
  useEffect(() => {
    if (!isLoading) { // ローディング中は保存処理を行わない
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teams));
    }
  }, [teams, isLoading]);

  const emptyTeam = {
    no: '',
    name: '',
    matches: Array(6).fill({
      win: 0,
      tie: 0,
      loss: 0,
      points: 0,
      signature: ''
    }),
    totals: {
      win: 0,
      tie: 0,
      loss: 0,
      points: 0
    }
  };

  const calculateTotals = (matches: any[]) => {
    return matches.reduce((acc, match) => ({
      win: acc.win + Number(match.win),
      tie: acc.tie + Number(match.tie),
      loss: acc.loss + Number(match.loss),
      points: acc.points + Number(match.points)
    }), { win: 0, tie: 0, loss: 0, points: 0 });
  };

  interface Team {
    no: string;
    name: string;
    matches: { win: number; tie: number; loss: number; points: number; signature: string }[]
    totals: {
      win: number;
      tie: number;
      loss: number;
      points: number;
    };
  }
  const sortTeams = (teamsToSort: Team[]) => {
    return [...teamsToSort].sort((a, b) => {
      if (a.totals.win !== b.totals.win) return b.totals.win - a.totals.win;
      if (a.totals.tie !== b.totals.tie) return b.totals.tie - a.totals.tie;
      return b.totals.points - a.totals.points;
    });
  };

  const handleTeamSubmit = (teamData: { no: string; name: string; matches: any[]; }) => {
    const totals = calculateTotals(teamData.matches);
    const newTeam: Team = {
      no: teamData.no,
      name: teamData.name,
      matches: teamData.matches,
      totals: totals
    };

    if (editMode && editTeamIndex !== null) {
      const updatedTeams :Team[] = [...teams];
      updatedTeams[editTeamIndex] = newTeam as Team;
      setTeams(sortTeams(updatedTeams));
      setEditMode(false);
      setEditTeamIndex(null);
    } else {
      setTeams(sortTeams([...teams, newTeam]));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(teams, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'molkky-scores.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (index :any) => {
    setEditMode(true);
    setEditTeamIndex(index);
  };

  const handleDelete = (index :any) => {
    if (window.confirm('このチームを削除してもよろしいですか？')) {
      const updatedTeams = [...teams];
      updatedTeams.splice(index, 1);
      setTeams(updatedTeams);
      
      // 編集中のチームが削除された場合、編集モードをキャンセル
      if (editMode && editTeamIndex === index) {
        setEditMode(false);
        setEditTeamIndex(null);
      }
    }
  };

  const clearAllData = () => {
    if (window.confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
      setTeams([]);
      setEditMode(false);
      setEditTeamIndex(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">モルックスコア管理</h2>
        </div>
        <div className="p-4">
          <TeamForm
            onSubmit={handleTeamSubmit}
            initialData={editMode ? teams[editTeamIndex as any] : emptyTeam}
            editMode={editMode}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">チーム一覧</h2>
          <div className="space-x-2">
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={exportData}
            >
              エクスポート
            </button>
            <button 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={clearAllData}
            >
              全データ削除
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">順位</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.map((team, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.no}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.totals.win}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.totals.tie}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.totals.loss}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{team.totals.points}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => startEdit(index)}
                      >
                        編集
                      </button>
                      <button 
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => handleDelete(index)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* <button 
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={exportData}
          >
            エクスポート
          </button> */}
        </div>
      </div>
    </div>
  );
};

interface TeamFormProps {
  onSubmit: (data: any) => void;
  initialData: any;
  editMode: boolean;
}

const TeamForm: React.FC<TeamFormProps> = ({ onSubmit, initialData, editMode }) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (matchIndex :any, field :any, value :any) => {
    const updatedMatches = [...formData.matches];
    updatedMatches[matchIndex] = {
      ...updatedMatches[matchIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      matches: updatedMatches
    });
  };

  const handleSubmit = (e :any) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(initialData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Team No.</label>
          <input
            type="text"
            value={formData.no}
            onChange={(e) => setFormData({ ...formData, no: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Team Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">試合</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signature</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formData.matches.map((match :any, index :any) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={match.win}
                    onChange={(e) => handleChange(index, 'win', Number(e.target.value))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={match.tie}
                    onChange={(e) => handleChange(index, 'tie', Number(e.target.value))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={match.loss}
                    onChange={(e) => handleChange(index, 'loss', Number(e.target.value))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={match.points}
                    onChange={(e) => handleChange(index, 'points', Number(e.target.value))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={match.signature}
                    onChange={(e) => handleChange(index, 'signature', e.target.value)}
                    className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button 
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {editMode ? '更新' : '追加'}
      </button>
    </form>
  );
};

export default MolkkyScoreApp;

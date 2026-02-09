'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import { getChampionNameSync, getChampionImageUrl, preloadChampionData } from '@/utils/championData';
import { 
  preloadRuneData, 
  getRuneImageUrl, 
  getRuneName,
  getRuneDescription,
  getRuneStyleImageUrl,
  getStatShardImageUrl,
  getStatShardName
} from '@/utils/runeData';
import { getLatestDataDragonVersion } from '@/utils/championData';
import { preloadItemData, getItemData } from '@/utils/itemData';
import { preloadSpellData, getSpellData } from '@/utils/spellData';

interface BuildArchetype {
  archetype: string;
  runes: {
    primaryStyleId: number;
    subStyleId: number;
    perkIds: number[];
    statShards: number[];
    winRate: number;
    games: number;
  };
  spells: {
    spell1Id: number;
    spell2Id: number;
    winRate: number;
    games: number;
  } | null;
  items: {
    items: number[];
    winRate: number;
    games: number;
  };
  totalGames: number;
  overallWinRate: number;
}

interface ItemBuildType {
  items: number[];
  winRate: number;
  games: number;
}

interface ChampionBuild {
  championId: number;
  patch: string;
  rank: string;
  role: string;
  region: string;
  tierStats: {
    championId: number;
    games: number;
    wins: number;
    winRate: number;
    pickRate: number;
    banRate: number;
  } | null;
  itemBuilds?: {
    starting: ItemBuildType[];
    core: ItemBuildType[];
    fourth: ItemBuildType[];
    fifth: ItemBuildType[];
    sixth: ItemBuildType[];
  };
  builds: BuildArchetype[];
}

// Get spell image URL
function getSpellImageUrl(spellId: number, version: string = '14.1.1'): string {
  const spellMap: Record<number, string> = {
    1: 'SummonerBoost', // Cleanse
    3: 'SummonerExhaust', // Exhaust
    4: 'SummonerFlash', // Flash
    6: 'SummonerHaste', // Ghost
    7: 'SummonerHeal', // Heal
    11: 'SummonerSmite', // Smite
    12: 'SummonerTeleport', // Teleport
    13: 'SummonerMana', // Clarity
    14: 'SummonerIgnite', // Ignite
    21: 'SummonerBarrier', // Barrier
  };
  const spellName = spellMap[spellId] || 'SummonerFlash';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellName}.png`;
}

// Get item image URL
function getItemImageUrl(itemId: number, version?: string): string {
  const ddVersion = version || (typeof window !== 'undefined' && (window as any).__DD_VERSION__) || '14.1.1';
  return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`;
}

export default function ChampionBuildPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const championId = parseInt(params.championId as string, 10);

  const [build, setBuild] = useState<ChampionBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [championDataLoaded, setChampionDataLoaded] = useState(false);
  const [runeDataLoaded, setRuneDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildIndex, setSelectedBuildIndex] = useState(0);
  const [runeImages, setRuneImages] = useState<Map<number, string>>(new Map());
  const [runeNames, setRuneNames] = useState<Map<number, string>>(new Map());
  const [runeDescriptions, setRuneDescriptions] = useState<Map<number, string>>(new Map());
  const [runeStyleImages, setRuneStyleImages] = useState<Map<number, string>>(new Map());
  const [statShardImages, setStatShardImages] = useState<Map<number, string>>(new Map());
  const [statShardNames, setStatShardNames] = useState<Map<number, string>>(new Map());
  const [itemData, setItemData] = useState<Map<number, { name: string; description: string }>>(new Map());
  const [spellData, setSpellData] = useState<Map<number, { name: string; description: string }>>(new Map());
  const [ddVersion, setDdVersion] = useState<string>('14.1.1');

  const rank = searchParams.get('rank') || 'ALL_RANKS';
  const role = searchParams.get('role') || 'ALL';
  const patch = searchParams.get('patch') || 'latest';
  const region = searchParams.get('region') || 'world';

  useEffect(() => {
    Promise.all([
      preloadChampionData(),
      preloadRuneData()
    ]).then(() => {
      setChampionDataLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!championDataLoaded || isNaN(championId)) {
      return;
    }

    const loadBuild = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = getApiUrl();
        const params = new URLSearchParams({
          rank,
          role,
          patch,
          ...(region !== 'world' && { region }),
        });

        let response;
        try {
          response = await fetch(`${apiUrl}/champions/${championId}/build?${params}`);
        } catch (fetchError: any) {
          // Handle network errors (connection refused, timeout, etc.)
          console.error('[loadBuild] Failed to fetch from server:', fetchError);
          if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_CONNECTION_REFUSED')) {
            throw new Error('Cannot connect to the API server. Please ensure the server is running on port 4000.');
          }
          throw new Error(`Network error: ${fetchError.message}`);
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        let data;
        try {
          // Try to parse JSON response
          const text = await response.text();
          console.log('[loadBuild] Raw server response text (first 2000 chars):', text.substring(0, 2000));
          data = JSON.parse(text);
          console.log('[loadBuild] Parsed response data:', data);
        } catch (parseError: any) {
          // If JSON parsing fails, it might be due to BigInt serialization
          console.error('[loadBuild] Failed to parse JSON response:', parseError);
          console.error('[loadBuild] Response text that failed to parse:', text?.substring(0, 1000));
          throw new Error(`Failed to parse server response: ${parseError.message}`);
        }
        
        if (data.error) {
          // Check if it's a serialization error and provide helpful message
          console.error('[loadBuild] Server returned error response:', data);
          if (data.error.includes('serialization') || data.error.includes('BigInt')) {
            throw new Error('Server encountered a data processing error. The API server may need to be restarted. Please try again in a moment.');
          }
          throw new Error(data.error);
        }

        console.log('[loadBuild] ========== FULL BUILD DATA RECEIVED ==========');
        console.log('[loadBuild] Champion ID:', data.championId);
        console.log('[loadBuild] Build archetypes count:', data.builds?.length || 0);
        console.log('[loadBuild] Full itemBuilds object:', JSON.stringify(data.itemBuilds, null, 2));
        console.log('[loadBuild] Item builds breakdown:', {
          hasItemBuilds: !!data.itemBuilds,
          starting: {
            exists: !!data.itemBuilds?.starting,
            length: data.itemBuilds?.starting?.length || 0,
            data: data.itemBuilds?.starting || []
          },
          core: {
            exists: !!data.itemBuilds?.core,
            length: data.itemBuilds?.core?.length || 0,
            data: data.itemBuilds?.core || []
          },
          fourth: {
            exists: !!data.itemBuilds?.fourth,
            length: data.itemBuilds?.fourth?.length || 0,
            data: data.itemBuilds?.fourth || []
          },
          fifth: {
            exists: !!data.itemBuilds?.fifth,
            length: data.itemBuilds?.fifth?.length || 0,
            data: data.itemBuilds?.fifth || []
          },
          sixth: {
            exists: !!data.itemBuilds?.sixth,
            length: data.itemBuilds?.sixth?.length || 0,
            data: data.itemBuilds?.sixth || []
          }
        });
        console.log('[loadBuild] First build archetype runes:', data.builds?.[0]?.runes);
        console.log('[loadBuild] First build archetype perkIds:', data.builds?.[0]?.runes?.perkIds);
        console.log('[loadBuild] First build archetype perkIds type:', typeof data.builds?.[0]?.runes?.perkIds, Array.isArray(data.builds?.[0]?.runes?.perkIds));
        // #region agent log
        if (data.builds && data.builds.length > 0) {
          const firstBuildRunes = data.builds[0].runes;
          fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:222',message:'First build runes structure',data:{primaryStyleId:firstBuildRunes?.primaryStyleId,subStyleId:firstBuildRunes?.subStyleId,perkIds:firstBuildRunes?.perkIds,perkIdsType:typeof firstBuildRunes?.perkIds,isArray:Array.isArray(firstBuildRunes?.perkIds),perkIdsLength:firstBuildRunes?.perkIds?.length},timestamp:Date.now(),runId:'debug1',hypothesisId:'E'})}).catch(()=>{});
        }
        // #endregion
        console.log('[loadBuild] ==============================================');

        setBuild(data);
        if (data.builds && data.builds.length > 0) {
          setSelectedBuildIndex(0);
          
          // Load rune images and style images - ensure rune data is preloaded first
          const loadRuneImages = async () => {
            // #region agent log
            console.log('[loadRuneImages] Starting rune image loading');
            console.log('[loadRuneImages] Build archetypes count:', data.builds.length);
            console.log('[loadRuneImages] First build perkIds:', data.builds[0]?.runes?.perkIds);
            fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:229',message:'Starting rune image loading',data:{buildsCount:data.builds.length,firstBuildPerkIds:data.builds[0]?.runes?.perkIds},timestamp:Date.now(),runId:'debug1',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            // Ensure rune data is loaded
            await preloadRuneData();
            await preloadItemData();
            await preloadSpellData();
            
            // Get Data Dragon version for spell/item images
            try {
              const version = await getLatestDataDragonVersion();
              if (version) {
                setDdVersion(version);
                if (typeof window !== 'undefined') {
                  (window as any).__DD_VERSION__ = version;
                }
              }
            } catch (err) {
              console.warn('Failed to get Data Dragon version:', err);
            }
            
            const runeImgMap = new Map<number, string>();
            const runeNameMap = new Map<number, string>();
            const runeDescMap = new Map<number, string>();
            const styleImgMap = new Map<number, string>();
            const statShardImgMap = new Map<number, string>();
            const statShardNameMap = new Map<number, string>();
            const itemDataMap = new Map<number, { name: string; description: string }>();
            const spellDataMap = new Map<number, { name: string; description: string }>();
            
            for (const buildArchetype of data.builds) {
              // Load stat shard images and names
              if (buildArchetype.runes.statShards && Array.isArray(buildArchetype.runes.statShards)) {
                for (const shardId of buildArchetype.runes.statShards) {
                  if (!statShardImgMap.has(shardId)) {
                    try {
                      const shardImgUrl = await getStatShardImageUrl(shardId);
                      const shardName = await getStatShardName(shardId);
                      statShardImgMap.set(shardId, shardImgUrl);
                      statShardNameMap.set(shardId, shardName);
                    } catch (err) {
                      console.error(`[loadRuneImages] Failed to load stat shard ${shardId}:`, err);
                    }
                  }
                }
              }
              // Load rune style images
              if (!styleImgMap.has(buildArchetype.runes.primaryStyleId)) {
                try {
                  console.log(`[loadRuneImages] Loading primary style ${buildArchetype.runes.primaryStyleId}`);
                  const primaryStyleUrl = await getRuneStyleImageUrl(buildArchetype.runes.primaryStyleId);
                  console.log(`[loadRuneImages] Primary style ${buildArchetype.runes.primaryStyleId} loaded: ${primaryStyleUrl}`);
                  styleImgMap.set(buildArchetype.runes.primaryStyleId, primaryStyleUrl);
                } catch (err) {
                  console.error(`[loadRuneImages] Failed to load primary style ${buildArchetype.runes.primaryStyleId}:`, err);
                }
              }
              if (!styleImgMap.has(buildArchetype.runes.subStyleId)) {
                try {
                  console.log(`[loadRuneImages] Loading sub style ${buildArchetype.runes.subStyleId}`);
                  const subStyleUrl = await getRuneStyleImageUrl(buildArchetype.runes.subStyleId);
                  console.log(`[loadRuneImages] Sub style ${buildArchetype.runes.subStyleId} loaded: ${subStyleUrl}`);
                  styleImgMap.set(buildArchetype.runes.subStyleId, subStyleUrl);
                } catch (err) {
                  console.error(`[loadRuneImages] Failed to load sub style ${buildArchetype.runes.subStyleId}:`, err);
                }
              }
              
              // Load rune images and descriptions
              if (!buildArchetype.runes?.perkIds || !Array.isArray(buildArchetype.runes.perkIds)) {
                console.error(`[loadRuneImages] Invalid perkIds for build archetype:`, buildArchetype.runes);
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:278',message:'Invalid perkIds detected',data:{runes:buildArchetype.runes,perkIds:buildArchetype.runes?.perkIds,perkIdsType:typeof buildArchetype.runes?.perkIds,isArray:Array.isArray(buildArchetype.runes?.perkIds)},timestamp:Date.now(),runId:'debug1',hypothesisId:'G'})}).catch(()=>{});
                // #endregion
                continue;
              }
              for (const perkId of buildArchetype.runes.perkIds) {
                if (!runeImgMap.has(perkId)) {
                  try {
                    console.log(`[loadRuneImages] Loading rune perk ${perkId} (type: ${typeof perkId})`);
                    const imgUrl = await getRuneImageUrl(Number(perkId));
                    const name = await getRuneName(Number(perkId));
                    const desc = await getRuneDescription(Number(perkId));
                    if (imgUrl && name && !imgUrl.includes('StatModsEmpty')) {
                      console.log(`[loadRuneImages] Rune perk ${perkId} loaded: ${imgUrl} (${name})`);
                      runeImgMap.set(Number(perkId), imgUrl);
                      runeNameMap.set(Number(perkId), name);
                      runeDescMap.set(Number(perkId), desc);
                    } else {
                      console.warn(`[loadRuneImages] Rune perk ${perkId} returned empty/invalid URL or name:`, { imgUrl, name });
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:286',message:'Rune perk returned invalid data',data:{perkId,imgUrl,name},timestamp:Date.now(),runId:'debug1',hypothesisId:'H'})}).catch(()=>{});
                      // #endregion
                    }
                  } catch (err) {
                    console.error(`[loadRuneImages] Failed to load rune for perk ${perkId}:`, err);
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:295',message:'Failed to load rune',data:{perkId,error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),runId:'debug1',hypothesisId:'I'})}).catch(()=>{});
                    // #endregion
                  }
                }
              }
              
              // Load spell data
              if (buildArchetype.spells) {
                if (!spellDataMap.has(buildArchetype.spells.spell1Id)) {
                  try {
                    const spell1Data = await getSpellData(buildArchetype.spells.spell1Id);
                    spellDataMap.set(buildArchetype.spells.spell1Id, spell1Data);
                  } catch (err) {
                    console.error(`[loadRuneImages] Failed to load spell data for ${buildArchetype.spells.spell1Id}:`, err);
                  }
                }
                if (!spellDataMap.has(buildArchetype.spells.spell2Id)) {
                  try {
                    const spell2Data = await getSpellData(buildArchetype.spells.spell2Id);
                    spellDataMap.set(buildArchetype.spells.spell2Id, spell2Data);
                  } catch (err) {
                    console.error(`[loadRuneImages] Failed to load spell data for ${buildArchetype.spells.spell2Id}:`, err);
                  }
                }
              }
            }
            
            // Load item data for all item builds
            if (data.itemBuilds) {
              const allItemIds = new Set<number>();
              [...(data.itemBuilds.starting || []), ...(data.itemBuilds.core || []), 
               ...(data.itemBuilds.fourth || []), ...(data.itemBuilds.fifth || []), 
               ...(data.itemBuilds.sixth || [])].forEach(build => {
                build.items?.forEach(itemId => {
                  if (itemId > 0) allItemIds.add(itemId);
                });
              });
              
              for (const itemId of allItemIds) {
                if (!itemDataMap.has(itemId)) {
                  try {
                    const itemInfo = await getItemData(itemId);
                    itemDataMap.set(itemId, itemInfo);
                  } catch (err) {
                    console.error(`[loadRuneImages] Failed to load item data for ${itemId}:`, err);
                  }
                }
              }
            }
            
            console.log(`[loadRuneImages] ========== RUNE IMAGE LOADING SUMMARY ==========`);
            console.log(`[loadRuneImages] Loaded ${runeImgMap.size} rune images, ${runeNameMap.size} rune names, ${styleImgMap.size} style images`);
            console.log(`[loadRuneImages] Rune images map:`, Array.from(runeImgMap.entries()));
            console.log(`[loadRuneImages] Rune names map:`, Array.from(runeNameMap.entries()));
            console.log(`[loadRuneImages] Style images map:`, Array.from(styleImgMap.entries()));
            console.log(`[loadRuneImages] All perk IDs from builds:`, data.builds.flatMap(b => b.runes.perkIds));
            console.log(`[loadRuneImages] Missing rune images:`, data.builds.flatMap(b => b.runes.perkIds).filter(id => !runeImgMap.has(id)));
            console.log(`[loadRuneImages] ================================================`);
            
            // #region agent log
            const primaryStyleIds = data.builds.map(b => b.runes.primaryStyleId);
            const subStyleIds = data.builds.map(b => b.runes.subStyleId);
            const loadedStyleIds = Array.from(styleImgMap.keys());
            console.log(`[loadRuneImages] Primary style IDs from builds:`, primaryStyleIds);
            console.log(`[loadRuneImages] Sub style IDs from builds:`, subStyleIds);
            console.log(`[loadRuneImages] Loaded style IDs:`, loadedStyleIds);
            fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:299',message:'Rune style images loaded',data:{runeImagesCount:runeImgMap.size,styleImagesCount:styleImgMap.size,primaryStyleIds,subStyleIds,loadedStyleIds},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            // #region agent log
            console.log('[loadRuneImages] Final rune image map size:', runeImgMap.size);
            console.log('[loadRuneImages] Final rune name map size:', runeNameMap.size);
            console.log('[loadRuneImages] Final style image map size:', styleImgMap.size);
            console.log('[loadRuneImages] Rune image map keys:', Array.from(runeImgMap.keys()));
            console.log('[loadRuneImages] Style image map keys:', Array.from(styleImgMap.keys()));
            fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:360',message:'Rune image loading complete',data:{runeImgMapSize:runeImgMap.size,runeNameMapSize:runeNameMap.size,styleImgMapSize:styleImgMap.size,runeImgMapKeys:Array.from(runeImgMap.keys()),styleImgMapKeys:Array.from(styleImgMap.keys())},timestamp:Date.now(),runId:'debug1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion
            setRuneImages(runeImgMap);
            setRuneNames(runeNameMap);
            setRuneDescriptions(runeDescMap);
            setRuneStyleImages(styleImgMap);
            setStatShardImages(statShardImgMap);
            setStatShardNames(statShardNameMap);
            setItemData(itemDataMap);
            setSpellData(spellDataMap);
            setRuneDataLoaded(true);
          };
          
          loadRuneImages();
        }
      } catch (err: any) {
        console.error('Error loading champion build:', err);
        setError(err.message || 'Failed to load champion build');
      } finally {
        setLoading(false);
      }
    };

    loadBuild();
  }, [championId, rank, role, patch, region, championDataLoaded]);

  if (loading || !championDataLoaded || !runeDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-[#94A3B8]">Loading champion build...</p>
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-[#94A3B8] mb-6">{error || 'Champion build not found'}</p>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold"
          >
            Back to Champions
          </button>
        </div>
      </div>
    );
  }

  const championName = getChampionNameSync(championId);
  const championImageUrl = getChampionImageUrl(championId);
  const selectedBuild = build.builds && build.builds.length > 0 ? build.builds[selectedBuildIndex] : null;

  if (!selectedBuild && (!build.builds || build.builds.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {championName}
          </h1>
          <p className="text-[#94A3B8] mb-6">
            No build data available for this champion yet. Build data is computed from match statistics.
            <br />
            <span className="text-sm text-[#64748B]">Try selecting different filters or wait for more matches to be processed.</span>
          </p>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold"
          >
            Back to Champions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="mb-6 text-[#94A3B8] hover:text-white transition-colors flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Champions</span>
          </button>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-[#1E293B] shadow-xl">
                <img
                  src={championImageUrl}
                  alt={championName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {championName}
              </h1>
              <p className="text-[#94A3B8] text-sm mb-4">
                {build.role} • {build.rank.replace('_', ' ')} • Patch {build.patch} • {build.region === 'world' ? 'World' : build.region.toUpperCase()}
              </p>
              {build.tierStats && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Win Rate: </span>
                    <span className="text-emerald-400 font-bold">{build.tierStats.winRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Pick Rate: </span>
                    <span className="text-blue-400 font-bold">{build.tierStats.pickRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Ban Rate: </span>
                    <span className="text-red-400 font-bold">{build.tierStats.banRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg">
                    <span className="text-[#94A3B8]">Matches: </span>
                    <span className="text-white font-bold">{build.tierStats.games.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build Archetype Tabs */}
        {build.builds.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2 border-b border-[#1E293B] pb-4">
            {build.builds.map((buildArchetype, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBuildIndex(idx)}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  selectedBuildIndex === idx
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#334155]'
                }`}
              >
                {buildArchetype.archetype}
              </button>
            ))}
          </div>
        )}

        {/* Build Display */}
        <div className="space-y-6">
          {/* Runes Section */}
          <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Rune Setup</h2>
              <div className="text-sm text-[#94A3B8]">
                <span className="text-emerald-400 font-semibold">{selectedBuild.runes.winRate.toFixed(1)}%</span> win rate •{' '}
                <span className="text-white">{selectedBuild.runes.games.toLocaleString()}</span> games
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
              {/* Primary Runes */}
              <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155] overflow-visible">
                <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Primary</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center overflow-hidden">
                    {runeStyleImages.get(selectedBuild.runes.primaryStyleId) ? (
                      <img
                        src={runeStyleImages.get(selectedBuild.runes.primaryStyleId)!}
                        alt={`Style ${selectedBuild.runes.primaryStyleId}`}
                        className="w-full h-full object-cover"
                        onError={async (e) => {
                          const img = e.target as HTMLImageElement;
                          const styleUrl = runeStyleImages.get(selectedBuild.runes.primaryStyleId);
                          console.error(`[RuneStyleImage] Failed to load primary style ${selectedBuild.runes.primaryStyleId}: ${styleUrl}`);
                          // Try alternative CDN (canisback) as fallback
                          try {
                            if (styleUrl) {
                              const altUrl = styleUrl.replace('ddragon.leagueoflegends.com/cdn', 'ddragon.canisback.com');
                              console.log(`[RuneStyleImage] Trying alternative CDN for style ${selectedBuild.runes.primaryStyleId}: ${altUrl}`);
                              img.src = altUrl;
                              setRuneStyleImages(prev => new Map(prev).set(selectedBuild.runes.primaryStyleId, altUrl));
                            }
                          } catch (err) {
                            console.error(`[RuneStyleImage] Error reloading style ${selectedBuild.runes.primaryStyleId}:`, err);
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.primaryStyleId}</span>`;
                            }
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.primaryStyleId}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(0, 4).map((perkId, idx) => {
                      const perkIdNum = Number(perkId);
                      const runeImg = runeImages.get(perkIdNum);
                      const runeName = runeNames.get(perkIdNum) || `Perk ${perkIdNum}`;
                      const runeDesc = runeDescriptions.get(perkIdNum) || '';
                      console.log(`[RuneRender] Rendering primary rune ${perkId} (as ${perkIdNum}):`, { runeImg, runeName, hasImage: !!runeImg, runeImagesSize: runeImages.size, runeImagesKeys: Array.from(runeImages.keys()) });
                      console.log(`[RuneRender] runeImages map check:`, { 
                        perkIdNum, 
                        hasKey: runeImages.has(perkIdNum), 
                        getResult: runeImages.get(perkIdNum),
                        allKeys: Array.from(runeImages.keys()),
                        allEntries: Array.from(runeImages.entries()).slice(0, 5)
                      });
                      return (
                        <div
                          key={`${perkIdNum}-${idx}`}
                          className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-blue-500/50 transition-colors flex items-center justify-center group relative overflow-visible"
                        >
                          {runeImg ? (
                            <>
                              <img
                                key={`rune-img-${perkIdNum}-${idx}`}
                                src={runeImg}
                                alt={runeName}
                                className="w-full h-full object-cover rounded-lg"
                                style={{ display: 'block' }}
                                onLoad={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  console.log(`[RuneImage] Successfully loaded primary rune image for perk ${perkIdNum}: ${img.src}`);
                                  img.style.display = 'block';
                                  img.style.opacity = '1';
                                }}
                                onError={async (e) => {
                                  const img = e.target as HTMLImageElement;
                                  const currentSrc = img.src;
                                  console.error(`[RuneImage] Failed to load rune image for perk ${perkIdNum}: ${currentSrc}`);
                                  
                                  // Try multiple fallback strategies
                                  try {
                                    const iconPathMatch = runeImg.match(/\/img\/(.+)$/);
                                    if (iconPathMatch) {
                                      const iconPath = iconPathMatch[1];
                                      
                                      // Strategy 1: Try canisback without version
                                      if (!currentSrc.includes('canisback.com')) {
                                        const altUrl1 = `https://ddragon.canisback.com/img/${iconPath}`;
                                        console.log(`[RuneImage] Trying fallback CDN (strategy 1) for perk ${perkIdNum}: ${altUrl1}`);
                                        img.onerror = null; // Remove this handler to prevent infinite loop
                                        img.src = altUrl1;
                                        
                                        // Set up new error handler for fallback
                                        img.onerror = async (e2) => {
                                          const img2 = e2.target as HTMLImageElement;
                                          console.error(`[RuneImage] Fallback CDN also failed for perk ${perkIdNum}: ${img2.src}`);
                                          
                                          // Strategy 2: Try canisback with version from original URL
                                          const versionMatch = runeImg.match(/\/cdn\/([^/]+)\//);
                                          if (versionMatch) {
                                            const version = versionMatch[1];
                                            const altUrl2 = `https://ddragon.canisback.com/${version}/img/${iconPath}`;
                                            console.log(`[RuneImage] Trying fallback CDN (strategy 2) for perk ${perkIdNum}: ${altUrl2}`);
                                            img2.onerror = null;
                                            img2.src = altUrl2;
                                            
                                            // Final fallback: show text
                                            img2.onerror = () => {
                                              console.error(`[RuneImage] All fallbacks failed for perk ${perkIdNum}`);
                                              img2.style.display = 'none';
                                              const parent = img2.parentElement;
                                              if (parent) {
                                                parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                              }
                                            };
                                          } else {
                                            // No version found, show text
                                            img2.style.display = 'none';
                                            const parent = img2.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                            }
                                          }
                                        };
                                      } else {
                                        // Already tried canisback, show text
                                        throw new Error('All CDN attempts failed');
                                      }
                                    } else {
                                      throw new Error('Could not extract icon path from URL');
                                    }
                                  } catch (err) {
                                    console.error(`[RuneImage] Error handling fallback for rune ${perkIdNum}:`, err);
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                    }
                                  }
                                }}
                              />
                              {/* Fallback text that shows if image fails */}
                              <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors" style={{ display: 'none' }}>{perkIdNum}</span>
                            </>
                          ) : (
                            <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors">{perkIdNum}</span>
                          )}
                          {runeDesc ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                              <div className="font-bold text-base text-blue-400 mb-2">{runeName}</div>
                              <div className="text-[#94A3B8] leading-relaxed">{runeDesc}</div>
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-semibold">
                              {runeName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Stat Shards */}
                  {selectedBuild.runes.statShards && selectedBuild.runes.statShards.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#334155]">
                      <div className="text-xs text-[#64748B] mb-2 font-semibold uppercase tracking-wider">Stat Shards</div>
                      <div className="flex gap-2">
                        {selectedBuild.runes.statShards.map((shardId, idx) => {
                          const shardIdNum = Number(shardId);
                          const shardImg = statShardImages.get(shardIdNum);
                          const shardName = statShardNames.get(shardIdNum) || `Shard ${shardIdNum}`;
                          return (
                            <div
                              key={`shard-${shardIdNum}-${idx}`}
                              className="w-8 h-8 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-blue-500/50 transition-colors flex items-center justify-center group relative overflow-visible"
                            >
                              {shardImg ? (
                                <img
                                  src={shardImg}
                                  alt={shardName}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] text-[#94A3B8]">${shardIdNum}</span>`;
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-[#94A3B8]">{shardIdNum}</span>
                              )}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {shardName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Runes */}
              <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155] overflow-visible">
                <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Secondary</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center overflow-visible">
                    {runeStyleImages.get(selectedBuild.runes.subStyleId) ? (
                      <img
                        src={runeStyleImages.get(selectedBuild.runes.subStyleId)!}
                        alt={`Style ${selectedBuild.runes.subStyleId}`}
                        className="w-full h-full object-cover"
                        onError={async (e) => {
                          const img = e.target as HTMLImageElement;
                          const styleUrl = runeStyleImages.get(selectedBuild.runes.subStyleId);
                          console.error(`[RuneStyleImage] Failed to load sub style ${selectedBuild.runes.subStyleId}: ${styleUrl}`);
                          // Try alternative CDN (canisback) as fallback
                          // canisback CDN structure: https://ddragon.canisback.com/img/{icon_path}
                          try {
                            if (styleUrl) {
                              const iconPathMatch = styleUrl.match(/\/img\/(.+)$/);
                              if (iconPathMatch) {
                                const iconPath = iconPathMatch[1];
                                const altUrl = `https://ddragon.canisback.com/img/${iconPath}`;
                                console.log(`[RuneStyleImage] Trying alternative CDN for style ${selectedBuild.runes.subStyleId}: ${altUrl}`);
                                img.src = altUrl;
                                setRuneStyleImages(prev => new Map(prev).set(selectedBuild.runes.subStyleId, altUrl));
                              }
                            }
                          } catch (err) {
                            console.error(`[RuneStyleImage] Error reloading style ${selectedBuild.runes.subStyleId}:`, err);
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.subStyleId}</span>`;
                            }
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.subStyleId}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(4, 6).map((perkId, idx) => {
                      const perkIdNum = Number(perkId);
                      const runeImg = runeImages.get(perkIdNum);
                      const runeName = runeNames.get(perkIdNum) || `Perk ${perkIdNum}`;
                      const runeDesc = runeDescriptions.get(perkIdNum) || '';
                      console.log(`[RuneRender] Rendering secondary rune ${perkId} (as ${perkIdNum}):`, { runeImg, runeName, hasImage: !!runeImg });
                      return (
                        <div
                          key={`${perkIdNum}-${idx}`}
                          className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-purple-500/50 transition-colors flex items-center justify-center group relative overflow-visible"
                        >
                          {runeImg ? (
                            <>
                              <img
                                key={`rune-img-${perkIdNum}-${idx}`}
                                src={runeImg}
                                alt={runeName}
                                className="w-full h-full object-cover rounded-lg"
                                style={{ display: 'block' }}
                                onLoad={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  console.log(`[RuneImage] Successfully loaded secondary rune image for perk ${perkIdNum}: ${img.src}`);
                                  img.style.display = 'block';
                                  img.style.opacity = '1';
                                }}
                                onError={async (e) => {
                                  const img = e.target as HTMLImageElement;
                                  const currentSrc = img.src;
                                  console.error(`[RuneImage] Failed to load secondary rune image for perk ${perkIdNum}: ${currentSrc}`);
                                  
                                  // Try multiple fallback strategies
                                  try {
                                    const iconPathMatch = runeImg.match(/\/img\/(.+)$/);
                                    if (iconPathMatch) {
                                      const iconPath = iconPathMatch[1];
                                      
                                      // Strategy 1: Try canisback without version
                                      if (!currentSrc.includes('canisback.com')) {
                                        const altUrl1 = `https://ddragon.canisback.com/img/${iconPath}`;
                                        console.log(`[RuneImage] Trying fallback CDN (strategy 1) for perk ${perkIdNum}: ${altUrl1}`);
                                        img.onerror = null; // Remove this handler to prevent infinite loop
                                        img.src = altUrl1;
                                        
                                        // Set up new error handler for fallback
                                        img.onerror = async (e2) => {
                                          const img2 = e2.target as HTMLImageElement;
                                          console.error(`[RuneImage] Fallback CDN also failed for perk ${perkIdNum}: ${img2.src}`);
                                          
                                          // Strategy 2: Try canisback with version from original URL
                                          const versionMatch = runeImg.match(/\/cdn\/([^/]+)\//);
                                          if (versionMatch) {
                                            const version = versionMatch[1];
                                            const altUrl2 = `https://ddragon.canisback.com/${version}/img/${iconPath}`;
                                            console.log(`[RuneImage] Trying fallback CDN (strategy 2) for perk ${perkIdNum}: ${altUrl2}`);
                                            img2.onerror = null;
                                            img2.src = altUrl2;
                                            
                                            // Final fallback: show text
                                            img2.onerror = () => {
                                              console.error(`[RuneImage] All fallbacks failed for perk ${perkIdNum}`);
                                              img2.style.display = 'none';
                                              const parent = img2.parentElement;
                                              if (parent) {
                                                parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                              }
                                            };
                                          } else {
                                            // No version found, show text
                                            img2.style.display = 'none';
                                            const parent = img2.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                            }
                                          }
                                        };
                                      } else {
                                        // Already tried canisback, show text
                                        throw new Error('All CDN attempts failed');
                                      }
                                    } else {
                                      throw new Error('Could not extract icon path from URL');
                                    }
                                  } catch (err) {
                                    console.error(`[RuneImage] Error handling fallback for rune ${perkIdNum}:`, err);
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkIdNum}</span>`;
                                    }
                                  }
                                }}
                              />
                              <span className="text-xs text-[#94A3B8] group-hover:text-purple-400 transition-colors" style={{ display: 'none' }}>{perkIdNum}</span>
                            </>
                          ) : (
                            <span className="text-xs text-[#94A3B8] group-hover:text-purple-400 transition-colors">{perkIdNum}</span>
                          )}
                          {runeDesc ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                              <div className="font-bold text-base text-purple-400 mb-2">{runeName}</div>
                              <div className="text-[#94A3B8] leading-relaxed">{runeDesc}</div>
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-semibold">
                              {runeName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Spells & Items Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summoner Spells */}
            {selectedBuild.spells && (
              <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Summoner Spells</h2>
                  <div className="text-sm text-[#94A3B8]">
                    <span className="text-emerald-400 font-semibold">{selectedBuild.spells.winRate.toFixed(1)}%</span> win rate •{' '}
                    <span className="text-white">{selectedBuild.spells.games.toLocaleString()}</span> games
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden">
                    <img
                      src={getSpellImageUrl(selectedBuild.spells.spell1Id)}
                      alt={`Spell ${selectedBuild.spells.spell1Id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">${selectedBuild.spells.spell1Id}</span>`;
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Spell {selectedBuild.spells.spell1Id}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden">
                    <img
                      src={getSpellImageUrl(selectedBuild.spells.spell2Id, ddVersion)}
                      alt={`Spell ${selectedBuild.spells.spell2Id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">${selectedBuild.spells.spell2Id}</span>`;
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Spell {selectedBuild.spells.spell2Id}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items - U.GG Style Layout */}
            {(() => {
              console.log('[ItemBuildRender] Rendering item builds section');
              console.log('[ItemBuildRender] build.itemBuilds exists:', !!build.itemBuilds);
              console.log('[ItemBuildRender] build.itemBuilds:', build.itemBuilds);
              console.log('[ItemBuildRender] Starting items length:', build.itemBuilds?.starting?.length || 0);
              console.log('[ItemBuildRender] Core items length:', build.itemBuilds?.core?.length || 0);
              console.log('[ItemBuildRender] Fourth items length:', build.itemBuilds?.fourth?.length || 0);
              console.log('[ItemBuildRender] Fifth items length:', build.itemBuilds?.fifth?.length || 0);
              console.log('[ItemBuildRender] Sixth items length:', build.itemBuilds?.sixth?.length || 0);
              // #region agent log
              const itemBuildsData = {
                starting: build.itemBuilds?.starting?.length || 0,
                core: build.itemBuilds?.core?.length || 0,
                fourth: build.itemBuilds?.fourth?.length || 0,
                fifth: build.itemBuilds?.fifth?.length || 0,
                sixth: build.itemBuilds?.sixth?.length || 0,
                startingSample: build.itemBuilds?.starting?.[0] ? { items: build.itemBuilds.starting[0].items, itemsLength: build.itemBuilds.starting[0].items.length, winRate: build.itemBuilds.starting[0].winRate, games: build.itemBuilds.starting[0].games } : null,
                coreSample: build.itemBuilds?.core?.[0] ? { items: build.itemBuilds.core[0].items, itemsLength: build.itemBuilds.core[0].items.length, winRate: build.itemBuilds.core[0].winRate, games: build.itemBuilds.core[0].games } : null,
                fourthSample: build.itemBuilds?.fourth?.[0] ? { items: build.itemBuilds.fourth[0].items, itemsLength: build.itemBuilds.fourth[0].items.length, winRate: build.itemBuilds.fourth[0].winRate, games: build.itemBuilds.fourth[0].games } : null,
                fifthSample: build.itemBuilds?.fifth?.[0] ? { items: build.itemBuilds.fifth[0].items, itemsLength: build.itemBuilds.fifth[0].items.length, winRate: build.itemBuilds.fifth[0].winRate, games: build.itemBuilds.fifth[0].games } : null,
                sixthSample: build.itemBuilds?.sixth?.[0] ? { items: build.itemBuilds.sixth[0].items, itemsLength: build.itemBuilds.sixth[0].items.length, winRate: build.itemBuilds.sixth[0].winRate, games: build.itemBuilds.sixth[0].games } : null,
              };
              console.log('[ItemBuildRender] Detailed item builds data:', itemBuildsData);
              fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:697',message:'Item builds render check',data:itemBuildsData,timestamp:Date.now(),runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              return null; // Debug logging only, don't render anything here
            })()}
            {build.itemBuilds && (
              <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Item Build</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Starting Items */}
                  {build.itemBuilds.starting.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Starting Items</h3>
                      {build.itemBuilds.starting.slice(0, 1).map((buildOption, optIdx) => {
                        return (
                        <div key={optIdx} className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => {
                              const itemInfo = itemData.get(itemId);
                              return (
                                <div
                                  key={idx}
                                  className="w-12 h-12 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-visible"
                                >
                                  <img
                                    src={getItemImageUrl(itemId, ddVersion)}
                                    alt={itemInfo?.name || `Item ${itemId}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                    }}
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                                    {itemInfo ? (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">{itemInfo.name}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">{itemInfo.description}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">Item {itemId}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">Loading item data...</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span> Matches
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Core Items */}
                  {build.itemBuilds.core.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Core Items</h3>
                      {build.itemBuilds.core.slice(0, 1).map((buildOption, optIdx) => {
                        return (
                        <div key={optIdx} className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => {
                              const itemInfo = itemData.get(itemId);
                              return (
                                <div
                                  key={idx}
                                  className="w-12 h-12 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-visible"
                                >
                                  <img
                                    src={getItemImageUrl(itemId, ddVersion)}
                                    alt={itemInfo?.name || `Item ${itemId}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                    }}
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                                    {itemInfo ? (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">{itemInfo.name}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">{itemInfo.description}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">Item {itemId}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">Loading item data...</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span> Matches
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fourth Item Options */}
                  {build.itemBuilds.fourth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Fourth Item</h3>
                      {build.itemBuilds.fourth.slice(0, 3).map((buildOption, optIdx) => {
                        return (
                          <div key={optIdx} className="mb-3">
                            <div className="flex gap-2 mb-1">
                              {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => {
                                const itemInfo = itemData.get(itemId);
                                return (
                                  <div
                                    key={idx}
                                    className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-visible"
                                  >
                                    <img
                                      src={getItemImageUrl(itemId, ddVersion)}
                                      alt={itemInfo?.name || `Item ${itemId}`}
                                      className="w-full h-full object-cover rounded-lg"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                      }}
                                    />
                                    {itemInfo && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                                        <div className="font-bold text-base text-amber-400 mb-2">{itemInfo.name}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">{itemInfo.description}</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-xs text-[#64748B]">
                              <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                              <span className="text-white">{buildOption.games.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fifth Item Options */}
                  {build.itemBuilds.fifth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Fifth Item</h3>
                      {build.itemBuilds.fifth.slice(0, 3).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-3">
                          <div className="flex gap-2 mb-1">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => {
                              const itemInfo = itemData.get(itemId);
                              return (
                                <div
                                  key={idx}
                                  className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-visible"
                                >
                                  <img
                                    src={getItemImageUrl(itemId, ddVersion)}
                                    alt={itemInfo?.name || `Item ${itemId}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                    }}
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                                    {itemInfo ? (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">{itemInfo.name}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">{itemInfo.description}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">Item {itemId}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">Loading item data...</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sixth Item Options */}
                  {build.itemBuilds.sixth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Sixth Item</h3>
                      {build.itemBuilds.sixth.slice(0, 3).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-3">
                          <div className="flex gap-2 mb-1">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => {
                              const itemInfo = itemData.get(itemId);
                              return (
                                <div
                                  key={idx}
                                  className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-visible"
                                >
                                  <img
                                    src={getItemImageUrl(itemId, ddVersion)}
                                    alt={itemInfo?.name || `Item ${itemId}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                    }}
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line max-w-sm z-50 shadow-xl">
                                    {itemInfo ? (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">{itemInfo.name}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">{itemInfo.description}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="font-bold text-base text-amber-400 mb-2">Item {itemId}</div>
                                        <div className="text-[#94A3B8] leading-relaxed">Loading item data...</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faBox } from '@fortawesome/free-solid-svg-icons';
import BuildRequestModal from './BuildRequestModal';
import Toast, { ToastType } from './Toast';
import { trackEvent } from '../utils/analytics';
import { getShortPerformanceSummary } from '../utils/lanforgePerformanceEngine';

interface ComponentOption {
  id: string | number;
  name: string;
  description: string;
  price: number;
  specs?: any;
}

interface CaseOption {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  formFactor: string;
  color: string;
  specs?: any;
}

interface ConfiguratorProps {
  selectedCase: CaseOption;
  baseProductId?: string;
  initialSelectedParts?: Record<string, any>;
}

const Configurator: React.FC<ConfiguratorProps> = (props) => {
  const { selectedCase, baseProductId, initialSelectedParts } = props;
  const [selectedCaseColor, setSelectedCaseColor] = useState<string>('Black');
  const [componentCategories, setComponentCategories] = useState<any[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, any>>(initialSelectedParts || {});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [isBuildRequestModalOpen, setIsBuildRequestModalOpen] = useState<boolean>(false);
  const [buildFeePercentage, setBuildFeePercentage] = useState<number>(10);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean, duration?: number}>({ message: '', type: 'info', isVisible: false });
  const [bundles, setBundles] = useState<any[]>([]);
  const draftBuildIdRef = React.useRef<string | null>(null);
  const pendingSavePromiseRef = React.useRef<Promise<any> | null>(null);

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ message, type, isVisible: true, duration });
  };

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/business/public`)
      .then(res => res.json())
      .then(data => {
        if (data.businessInfo?.buildFeePercentage !== undefined) {
          setBuildFeePercentage(data.businessInfo.buildFeePercentage);
        }
      })
      .catch(err => console.error('Failed to fetch business info:', err));

    setTimeout(() => window.scrollTo(0, 0), 10);
  }, []);

  // Maps DB part types to configurator category IDs
  const normalizePartType = (type: string): string => {
    const t = type.toLowerCase();
    if (['cpu-cooler', 'cpu cooler', 'liquid cooler', 'air cooler'].includes(t)) return 'cooler';
    if (['fan', 'fans', 'case fan', 'case fans'].includes(t)) return 'fans';
    if (['ssd', 'hdd', 'nvme', 'm.2'].includes(t)) return 'storage';
    return t;
  };

  // Returns bundles where every part is currently selected
  const getActiveBundles = (components: Record<string, any> = selectedComponents) => {
    return bundles.filter(bundle =>
      bundle.parts.every((bp: any) => {
        const catId = normalizePartType(bp.type);
        const sel = components[catId];
        if (!sel) return false;
        const list = Array.isArray(sel) ? sel : [sel];
        return list.some((p: any) => String(p.id) === String(bp.part._id));
      })
    );
  };

  // Components total accounting for active bundles
  const calcComponentsTotal = (components: Record<string, any>, activeBundles: any[]) => {
    const bundledIds = new Set(
      activeBundles.flatMap((b: any) => b.parts.map((p: any) => String(p.part._id)))
    );
    const partsTotal = Object.values(components).reduce((sum: number, comp: any) => {
      if (Array.isArray(comp)) {
        return sum + comp.reduce((s: number, c: any) => {
          return bundledIds.has(String(c.id)) ? s : s + (c.price || 0);
        }, 0);
      }
      if (!comp || bundledIds.has(String(comp.id))) return sum;
      return sum + (comp.price || 0);
    }, 0);
    const bundleTotal = activeBundles.reduce((s: number, b: any) => s + b.bundlePrice, 0);
    return partsTotal + bundleTotal;
  };

  React.useEffect(() => {
    // Fetch bundles alongside parts
    fetch(`${process.env.REACT_APP_API_URL}/bundles`)
      .then(res => res.json())
      .then(data => { if (data.bundles) setBundles(data.bundles); })
      .catch(() => {});

    fetch(`${process.env.REACT_APP_API_URL}/pc-parts?limit=200`)
      .then(res => res.json())
      .then(data => {
        if (data.parts) {
          const grouped: Record<string, any> = {
            cpu: { id: 'cpu', name: 'Processor', options: [] },
            gpu: { id: 'gpu', name: 'Graphics', options: [] },
            motherboard: { id: 'motherboard', name: 'Motherboard', options: [] },
            ram: { id: 'ram', name: 'Memory', options: [] },
            storage: { id: 'storage', name: 'Storage', options: [] },
            cooler: { id: 'cooler', name: 'CPU Cooler', options: [] },
            psu: { id: 'psu', name: 'Power Supply', options: [] },
            fans: { id: 'fans', name: 'Case Fans', options: [] },
            os: { id: 'os', name: 'Operating System', options: [] }
          };

          data.parts.forEach((p: any) => {
            // Map types like 'ssd', 'hdd' to 'storage', and ignore cases or other unmapped types here
            let typeKey = p.type;
            if (['ssd', 'hdd', 'nvme', 'm.2'].includes(p.type.toLowerCase())) {
              typeKey = 'storage';
            }
            if (['cpu cooler', 'liquid cooler', 'air cooler', 'cpu-cooler'].includes(p.type.toLowerCase())) {
              typeKey = 'cooler';
            }
            if (['case fan', 'case fans', 'fan', 'fans'].includes(p.type.toLowerCase())) {
              typeKey = 'fans';
            }
            
            const cat = grouped[typeKey];
            if (cat) {
              cat.options.push({
                id: p._id,
                name: p.partModel || p.name || 'Unknown Component',
                description: p.brand || '',
                price: p.price || 0,
                specs: p.specs || {}
              });
            }
          });

          // Filter out empty categories
          const categoriesArray = Object.values(grouped).filter(c => c.options.length > 0);

          // Sort options in each category from lowest price to highest price
          categoriesArray.forEach(category => {
            category.options.sort((a: any, b: any) => a.price - b.price);
            
            // Allow skipping parts that aren't strictly required
            const requiredParts = ['cpu', 'motherboard', 'cooler', 'psu'];
            if (category.id !== 'fans' && !requiredParts.includes(category.id)) {
              let skipName = `No ${category.name} - Ship without a ${category.name}`;
              if (category.id === 'os') {
                skipName = `No Operating System - Ship without an OS`;
              } else if (category.id === 'gpu') {
                skipName = `No Graphics - Ship without a Graphics Card`;
              } else if (category.id === 'ram') {
                skipName = `No Memory - Ship without Memory`;
              } else if (category.id === 'storage') {
                skipName = `No Storage - Ship without Storage`;
              } else if (category.name.match(/^[AEIOU]/i)) {
                skipName = `No ${category.name} - Ship without an ${category.name}`;
              }
              
              category.options.unshift({
                id: `no-part-${category.id}`,
                name: skipName,
                description: `Skip selecting a ${category.name}`,
                price: 0,
                specs: {}
              });
            }
          });

          setComponentCategories(categoriesArray);

          // After fetching categories, map the pre-filled exact components if passed in
          if (props.initialSelectedParts && Object.keys(props.initialSelectedParts).length > 0) {
            const resolvedComponents: Record<string, any> = {};
            
            Object.entries(props.initialSelectedParts).forEach(([key, part]: [string, any]) => {
              const category = categoriesArray.find(c => c.id === key);
              if (category) {
                if (key === 'fans') {
                  const partsList = Array.isArray(part) ? part : [part];
                  resolvedComponents[key] = partsList.map(p => {
                    const fullOption = category.options.find((o: any) => String(o.id) === String(p.id || p._id || p));
                    return fullOption || {
                      id: p.id || p._id || p,
                      name: p.name || 'Unknown Component',
                      description: p.description || '',
                      price: p.price || 0
                    };
                  });
                } else {
                  const fullOption = category.options.find((o: any) => String(o.id) === String(part.id || part._id || part));
                  if (fullOption) {
                    resolvedComponents[key] = fullOption;
                  } else {
                    // Ensure partial item still falls back properly
                    resolvedComponents[key] = {
                      id: part.id || part._id || part,
                      name: part.name || 'Unknown Component',
                      description: part.description || '',
                      price: part.price || 0,
                      specs: part.specs || {}
                    };
                  }
                }
              }
            });
            
            setSelectedComponents(resolvedComponents);
          }
        }
      })
      .catch(err => console.error(err));
  }, [props.initialSelectedParts]);

  const getFilteredOptions = (category: any) => {
    if (!category || !category.options) return [];
    
    return category.options.filter((option: any) => {
      const specs = option.specs || {};

      if (category.id === 'motherboard') {
        // Case form factor check
        const caseFf = selectedCase.formFactor?.toLowerCase() || '';
        const boardFf = specs.formFactor?.toLowerCase() || '';
        if (caseFf && boardFf) {
          const isCaseItx = caseFf.includes('itx');
          const isCaseMatx = caseFf.includes('matx') || caseFf.includes('micro');
          const isCaseAtx = caseFf.includes('atx') && !isCaseMatx;
          const isCaseMidFull = caseFf.includes('mid-tower') || caseFf.includes('full-tower') || caseFf.includes('mid tower') || caseFf.includes('full tower');

          const isBoardItx = boardFf.includes('itx');
          const isBoardMatx = boardFf.includes('matx') || boardFf.includes('micro');
          const isBoardAtx = boardFf.includes('atx') && !isBoardMatx;

          if (isCaseItx && !isCaseMatx && !isCaseAtx) {
            // strictly ITX cases
            if (!isBoardItx) return false;
          } else if (isCaseMatx) {
            // mATX cases (support mATX and ITX)
            if (isBoardAtx) return false;
          } else if (isCaseAtx || isCaseMidFull) {
            // ATX / Mid-Tower / Full-Tower cases
            // User requested: don't offer ITX mobos for ATX builds
            if (isBoardItx) return false;
          }
        }

        // CPU socket check
        const cpu = selectedComponents.cpu;
        if (cpu && cpu.specs?.socket && specs.socket) {
          if (cpu.specs.socket !== specs.socket) return false;
        }

        // Also check AMD CPU naming vs LGA1851 Z890 boards
        if (cpu && option.name) {
          const isAmdCpu = cpu.name.toLowerCase().includes('amd') || cpu.name.toLowerCase().includes('ryzen');
          const isIntelBoard = option.name.toLowerCase().includes('z890') || option.name.toLowerCase().includes('lga1851');
          if (isAmdCpu && isIntelBoard) return false;

          const isIntelCpu = cpu.name.toLowerCase().includes('intel') || cpu.name.toLowerCase().includes('core');
          const isAmdBoard = option.name.toLowerCase().includes('x870') || option.name.toLowerCase().includes('b850');
          if (isIntelCpu && isAmdBoard) return false;
        }
      }

      if (category.id === 'ram') {
        const mobo = selectedComponents.motherboard;
        if (mobo && mobo.specs?.memoryType && specs.type) {
          if (mobo.specs.memoryType !== specs.type) return false;
        }
      }

      if (category.id === 'gpu') {
        const maxLength = selectedCase.specs?.maxGpuLength;
        if (maxLength && specs.length) {
          if (specs.length > maxLength) return false;
        }
      }

      if (category.id === 'psu') {
        const caseFf = selectedCase.formFactor?.toLowerCase() || '';
        const isCaseItx = caseFf.includes('itx');
        const isSFX = (specs.formFactor && specs.formFactor.toLowerCase().includes('sfx')) || 
                      /sfx|\bsf\d+\b/i.test(option.name) || 
                      /sfx/i.test(option.description || '');

        if (!String(option.id).startsWith('no-part-')) {
          if (isCaseItx) {
            if (!isSFX) return false;
          } else {
            if (isSFX) return false;
          }
        }

        const gpu = selectedComponents.gpu;

        let psuWattage = specs.wattage || 0;
        if (!psuWattage) {
          const match = option.name.match(/(\d+)W/i) || option.description?.match(/(\d+)W/i);
          if (match) psuWattage = parseInt(match[1]);
        }

        if (gpu && psuWattage > 0) {
          const gpuName = gpu.name.toLowerCase() || '';
          const gpuDesc = gpu.description?.toLowerCase() || '';
          
          if (gpuName.includes('5090') || gpuDesc.includes('5090')) {
            if (psuWattage < 1000) return false;
          }
        }
      }

      if (category.id === 'cooler') {
        const caseFf = selectedCase.formFactor?.toLowerCase() || '';
        const isCaseItx = caseFf.includes('itx');
        
        const getRadSize = (o: any) => {
          if (o.specs?.radiatorSize) return String(o.specs.radiatorSize).replace(/[^0-9]/g, '');
          const match = (o.name + ' ' + (o.description || '')).match(/(\d+)mm/i);
          return match ? match[1] : null;
        };

        const is240mm = getRadSize(option) === '240';

        if (!String(option.id).startsWith('no-part-')) {
          if (isCaseItx) {
            if (!is240mm) return false;
          } else {
            if (is240mm) return false;
          }
        }

        const cpu = selectedComponents.cpu;
        const mobo = selectedComponents.motherboard;
        const targetSocket = cpu?.specs?.socket || mobo?.specs?.socket;
        
        if (targetSocket && specs.socketSupport) {
          if (Array.isArray(specs.socketSupport)) {
             const supports = specs.socketSupport.some((s: string) => s.toLowerCase() === targetSocket.toLowerCase());
             if (!supports) return false;
          } else if (typeof specs.socketSupport === 'string') {
             if (!specs.socketSupport.toLowerCase().includes(targetSocket.toLowerCase())) return false;
          }
        }
        
        // Also check CPU cooler height against case maxCpuCoolerHeight
        const maxHeight = selectedCase.specs?.maxCpuCoolerHeight;
        if (maxHeight && specs.height) {
          if (specs.height > maxHeight) return false;
        }
      }

      return true;
    });
  };

  const currentCategory = componentCategories[currentStep] || { id: '', name: '', options: [] };

  // Calculate total price including the selected case, with bundle pricing applied
  const activeBundles = getActiveBundles(selectedComponents);
  const bundleSavings = activeBundles.reduce((sum: number, b: any) => {
    const individualSum = b.parts.reduce((s: number, bp: any) => s + (bp.part?.price || 0), 0);
    return sum + (individualSum - b.bundlePrice);
  }, 0);

  const componentsTotal = calcComponentsTotal(selectedComponents, activeBundles);
  const subtotal = componentsTotal + selectedCase.price;
  let calculatedBuildFee = subtotal * (buildFeePercentage / 100);
  if (calculatedBuildFee > 0) {
    const tens = Math.floor(calculatedBuildFee / 10) * 10;
    const opt1 = tens + 5.99;
    const opt2 = tens + 9.99;
    const opt3 = tens + 15.99;
    
    if (calculatedBuildFee <= opt1) {
      calculatedBuildFee = opt1;
    } else if (calculatedBuildFee <= opt2) {
      calculatedBuildFee = opt2;
    } else {
      calculatedBuildFee = opt3;
    }
  } else {
    calculatedBuildFee = 99.99;
  }
  
  const totalPrice = subtotal + calculatedBuildFee;

  const cpuName = selectedComponents.cpu && !String(selectedComponents.cpu.id).startsWith('no-part-') ? selectedComponents.cpu.name : null;
  const gpuName = selectedComponents.gpu && !String(selectedComponents.gpu.id).startsWith('no-part-') ? selectedComponents.gpu.name : null;
  const perf = cpuName && gpuName ? getShortPerformanceSummary(cpuName, gpuName) : null;
  const fortniteFPS = perf ? perf.highlights["1080p"].fortniteCompetitive.average : undefined;

  // Automatically save draft custom build and sync to URL so state isn't lost
  const saveDraftBuild = async (newSelectedComponents: Record<string, any>, newColor: string = selectedCaseColor) => {
    // Wait for any pending save to complete so we don't create multiple documents
    if (pendingSavePromiseRef.current) {
      try {
        await pendingSavePromiseRef.current;
      } catch (e) {
        // ignore
      }
    }

    const performSave = async () => {
      try {
        const partsMap = new Map<string | number, { quantity: number; partType: string }>();
        
        Object.entries(newSelectedComponents).forEach(([catId, comp]) => {
          const items = Array.isArray(comp) ? comp : [comp];
          items.forEach(item => {
            const existing = partsMap.get(item.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              partsMap.set(item.id, { quantity: 1, partType: catId });
            }
          });
        });

        const parts = Array.from(partsMap.entries()).map(([partId, data]) => ({
          part: String(partId).startsWith('no-part-') ? undefined : partId,
          quantity: data.quantity,
          partType: data.partType
        }));
        
        parts.push({
          part: selectedCase.id,
          quantity: 1,
          partType: 'Case'
        });
        
        if (parts.length === 1) return; // Only case selected, don't bother saving yet

        // Dynamically re-calculate totals with bundle pricing applied
        const newActiveBundles = getActiveBundles(newSelectedComponents);
        const newComponentsTotal = calcComponentsTotal(newSelectedComponents, newActiveBundles);
        const newSubtotal = newComponentsTotal + selectedCase.price;
        let newCalculatedBuildFee = newSubtotal * (buildFeePercentage / 100);
        if (newCalculatedBuildFee > 0) {
          const tens = Math.floor(newCalculatedBuildFee / 10) * 10;
          if (newCalculatedBuildFee <= tens + 5.99) newCalculatedBuildFee = tens + 5.99;
          else if (newCalculatedBuildFee <= tens + 9.99) newCalculatedBuildFee = tens + 9.99;
          else newCalculatedBuildFee = tens + 15.99;
        } else {
          newCalculatedBuildFee = 99.99;
        }
        
        const newTotalPrice = newSubtotal + newCalculatedBuildFee;

        // Use ref if available, otherwise check URL
        const urlBuildId = new URLSearchParams(window.location.search).get('buildId');
        const existingBuildId = urlBuildId || draftBuildIdRef.current;
        
        const res = await fetch(`${process.env.REACT_APP_API_URL}/custom-builds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buildId: existingBuildId || undefined,
            name: `Custom Build Draft`,
            baseProduct: baseProductId,
            parts,
            frontendSubtotal: newSubtotal,
            frontendLaborFee: newCalculatedBuildFee,
            frontendTotal: newTotalPrice,
            notes: `Case Color: ${newColor}`
          })
        });
        const buildData = await res.json();
        if (buildData.customBuild && buildData.customBuild.buildId) {
          draftBuildIdRef.current = buildData.customBuild.buildId;
          // Update URL quietly
          const url = new URL(window.location.href);
          url.searchParams.set('buildId', buildData.customBuild.buildId);
          window.history.replaceState({}, '', url);
        }
      } catch (err) {
        console.error('Failed to save draft build:', err);
      }
    };

    const promise = performSave();
    pendingSavePromiseRef.current = promise;
    try {
      await promise;
    } finally {
      if (pendingSavePromiseRef.current === promise) {
        pendingSavePromiseRef.current = null;
      }
    }
  };

  const handleSelect = (categoryId: string, option: ComponentOption) => {
    if (categoryId === 'fans') {
      handleFanChange(option, 1);
    } else {
      const next = { ...selectedComponents, [categoryId]: option };
      
      // Cascading compatibility clears
      if (categoryId === 'gpu') {
         const psu = next.psu;
         if (psu) {
           let psuWattage = psu.specs?.wattage || 0;
           if (!psuWattage) {
             const match = psu.name.match(/(\d+)W/i) || psu.description?.match(/(\d+)W/i);
             if (match) psuWattage = parseInt(match[1]);
           }
           
           if (psuWattage > 0) {
             const gpuName = option.name.toLowerCase() || '';
             const gpuDesc = option.description?.toLowerCase() || '';
             
             if ((gpuName.includes('5090') || gpuDesc.includes('5090')) && psuWattage < 1000) {
               delete next.psu;
             }
           }
         }
      }

      if (categoryId === 'cpu') {
         const mobo = next.motherboard;
         if (mobo && mobo.specs?.socket && option.specs?.socket && mobo.specs.socket !== option.specs.socket) {
           delete next.motherboard;
           // RAM might also need to be cleared, but usually it depends on motherboard's memoryType.
           // Best to clear RAM as well to be safe, since new motherboard might have different DDR type.
           delete next.ram;
         }
         const cooler = next.cooler;
         if (cooler && cooler.specs?.socketSupport && option.specs?.socket) {
           const ss = cooler.specs.socketSupport;
           let supports = false;
           if (Array.isArray(ss)) {
             supports = ss.some((s: string) => s.toLowerCase() === option.specs.socket.toLowerCase());
           } else if (typeof ss === 'string') {
             supports = ss.toLowerCase().includes(option.specs.socket.toLowerCase());
           }
           if (!supports) delete next.cooler;
         }
      }

      if (categoryId === 'motherboard') {
         const ram = next.ram;
         if (ram && ram.specs?.type && option.specs?.memoryType && ram.specs.type !== option.specs.memoryType) {
           delete next.ram;
         }
      }

      // Auto-select other parts in a bundle when one bundle part is chosen
      if (!String(option.id).startsWith('no-part-')) {
        const triggeredBundle = bundles.find((b: any) =>
          b.parts.some((bp: any) => String(bp.part._id) === String(option.id))
        );
        if (triggeredBundle) {
          triggeredBundle.parts.forEach((bp: any) => {
            if (String(bp.part._id) === String(option.id)) return;
            const catId = normalizePartType(bp.type);
            const cat = componentCategories.find((c: any) => c.id === catId);
            if (cat) {
              const match = cat.options.find((o: any) => String(o.id) === String(bp.part._id));
              if (match) next[catId] = match;
            }
          });
        }
      }

      setSelectedComponents(next);
      saveDraftBuild(next);
    }
  };

  const handleFanChange = (option: ComponentOption, delta: number) => {
    const prev = { ...selectedComponents };
    const currentFans = (prev.fans as ComponentOption[]) || [];
    let newFans = [...currentFans];
    
    if (delta > 0) {
      if (newFans.length < 2) {
        newFans.push(option);
      } else {
        showToast('You can only select up to 2 case fans total.', 'error');
      }
    } else if (delta < 0) {
      const index = newFans.findIndex(f => f.id === option.id);
      if (index !== -1) {
        newFans.splice(index, 1);
      }
    }

    const newState = { ...prev };
    if (newFans.length > 0) {
      newState.fans = newFans;
    } else {
      delete newState.fans;
    }
    
    setSelectedComponents(newState);
    saveDraftBuild(newState);
  };

  const handleShareBuild = async () => {
    setIsSharing(true);
    try {
      // Ensure any pending draft save finishes so the backend has the latest data
      if (pendingSavePromiseRef.current) {
        await pendingSavePromiseRef.current;
      }
      
      const finalBuildId = new URLSearchParams(window.location.search).get('buildId') || draftBuildIdRef.current;
      
      if (!finalBuildId) {
        // Edge case: if no buildId exists yet (e.g. only case selected, no components)
        // trigger an immediate save to get one.
        await saveDraftBuild(selectedComponents);
      }
      
      const newlySavedId = new URLSearchParams(window.location.search).get('buildId') || draftBuildIdRef.current;
      
      if (!newlySavedId) {
        throw new Error('Failed to create build ID');
      }

      const shareUrl = `${window.location.origin}/build/${newlySavedId}`;
      
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          showToast('Build link copied to clipboard!', 'success');
        } else {
          throw new Error('Fallback to execCommand');
        }
      } catch (clipErr) {
        // Fallback for non-secure contexts or Safari async limitations
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showToast('Build link copied to clipboard!', 'success');
          } else {
            showToast(`Build link generated!\n\n${shareUrl}`, 'success', 8000);
          }
        } catch (err) {
          showToast(`Build link generated!\n\n${shareUrl}`, 'success', 8000);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to generate share link.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleNextStep = () => {
    // Only allow proceeding if an item is selected for the current category, except for fans which are optional
    const currentCategoryId = componentCategories[currentStep]?.id;
    
    // Additional validation to prevent "None" option from satisfying required parts bypass somehow
    const requiredParts = ['cpu', 'motherboard', 'cooler', 'psu'];
    const isRequired = requiredParts.includes(currentCategoryId);
    const selectedPart = selectedComponents[currentCategoryId];
    
    if (currentCategoryId !== 'fans' && !selectedPart) {
      showToast(`Please select a ${componentCategories[currentStep]?.name} to continue.`, 'error');
      return;
    }
    
    if (isRequired && selectedPart && String(selectedPart.id).startsWith('no-part-')) {
      showToast(`A ${componentCategories[currentStep]?.name} is required for this build.`, 'error');
      return;
    }

    if (currentStep < componentCategories.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => window.scrollTo(0, 0), 10);
    } else {
      setShowReviewModal(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeout(() => window.scrollTo(0, 0), 10);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setTimeout(() => window.scrollTo(0, 0), 10);
  };

  const renderComponentSummary = (categoryId: string, component: any, categoryName: string) => {
    if (Array.isArray(component)) {
      if (component.length === 0) return null;
      // Group duplicates for summary
      const counts = new Map<string | number, { comp: ComponentOption; count: number }>();
      component.forEach(c => {
        const existing = counts.get(c.id);
        if (existing) existing.count += 1;
        else counts.set(c.id, { comp: c, count: 1 });
      });

      return Array.from(counts.values()).map(({ comp, count }, idx) => (
        <div key={`${categoryId}-${idx}`} className="flex justify-between items-start gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{categoryName}</div>
            <div className="text-sm text-gray-300 line-clamp-1">{count > 1 ? `${count}x ` : ''}{comp.description ? `${comp.description} ` : ''}{comp.name}</div>
          </div>
          <div className="text-sm text-white">${(comp.price * count).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      ));
    }

    return (
      <div key={categoryId} className="flex justify-between items-start gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{categoryName}</div>
          <div className="text-sm text-gray-300 line-clamp-1">
            {String(component.id).startsWith('no-part-') 
              ? component.name.split(' - ')[0] 
              : `${component.description ? `${component.description} ` : ''}${component.name}`}
          </div>
        </div>
        <div className="text-sm text-white">${component.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-950 text-gray-200 pb-32">
      {/* Subtle Top Promo Banner for Help */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-300 font-medium">Overwhelmed? Let our experts design the perfect system for you.</span>
          </div>
          <button 
            onClick={() => setIsBuildRequestModalOpen(true)}
            className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
          >
            Request Custom Build
          </button>
        </div>
      </div>

      {/* Progress Steps Header */}
      <section className="bg-gray-950 border-b border-gray-800 pt-12 pb-8 sticky top-[69px] z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 relative">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-4 pb-2 w-full justify-center lg:justify-start">
            {componentCategories.map((category, index) => {
              // For fans, it's considered selected if there's an array with at least 1 item
              let isCategorySelected = false;
              if (category.id === 'fans') {
                isCategorySelected = selectedComponents.fans && selectedComponents.fans.length > 0;
              } else {
                isCategorySelected = !!selectedComponents[category.id];
              }

              return (
              <button
                key={category.id}
                onClick={() => {
                  // Only allow jumping to previous steps, or the next immediate unselected step if all prior steps are filled
                  let canNavigate = index <= currentStep;
                  if (index === currentStep + 1) {
                     const prevCatId = componentCategories[currentStep]?.id;
                     canNavigate = prevCatId === 'fans' || !!selectedComponents[prevCatId];
                  }
                  if (canNavigate) {
                    handleStepClick(index);
                  }
                }}
                className={`flex items-center gap-1 sm:gap-3 whitespace-nowrap pb-2 px-1 transition-colors relative shrink-0 ${
                  currentStep === index
                    ? 'text-white'
                    : isCategorySelected
                    ? 'text-emerald-400 cursor-pointer'
                    : index <= currentStep
                    ? 'text-gray-300 cursor-pointer'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                disabled={index > currentStep && !(componentCategories[currentStep]?.id === 'fans' || selectedComponents[componentCategories[currentStep]?.id])}
              >
                <div className={`hidden lg:flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  currentStep === index
                    ? 'bg-white text-black'
                    : isCategorySelected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {isCategorySelected ? <FontAwesomeIcon icon={faCheck} className="w-[10px] h-[10px]" /> : index + 1}
                </div>
                <span className="font-semibold text-[11px] md:text-xs tracking-wide uppercase whitespace-nowrap">{category.name}</span>
                {currentStep === index && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute -bottom-[9px] left-0 right-0 h-[2px] bg-white" 
                  />
                )}
              </button>
            )})}
          </div>
        </div>
      </section>

      {/* Main Configurator Area */}
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Component Selection */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentCategory.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Mobile Steps Counter */}
              <div className="md:hidden flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div className="text-sm font-semibold text-emerald-400">
                  Step {currentStep + 1} of {componentCategories.length}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {Math.round(((currentStep + 1) / componentCategories.length) * 100)}% Complete
                </div>
              </div>
              
              <div className="mb-8 flex items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{currentCategory.name}</h2>
                  <p className="text-gray-400 text-sm">Select the best {currentCategory.name.toLowerCase()} for your build.</p>
                </div>
                <button
                  onClick={handleNextStep}
                  className="bg-white text-black hover:bg-gray-200 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-colors flex items-center gap-2 shrink-0"
                >
                  {currentStep === componentCategories.length - 1 ? 'Review Build' : (currentCategory.id === 'fans' && (!selectedComponents.fans || selectedComponents.fans.length === 0) ? 'Skip Fans' : 'Continue')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {(() => {
                  const options = getFilteredOptions(currentCategory);
                  
                  // Helper function to group options
                  const renderOptionsGroup = (title: string, groupOptions: any[]) => {
                    if (groupOptions.length === 0) return null;
                    return (
                      <div key={title} className="mb-6 last:mb-0">
                        {title && <h3 className="text-lg font-semibold text-emerald-400 mb-3 px-1">{title}</h3>}
                        <div className="space-y-3">
                          {groupOptions.map((option: any) => {
                            const isFans = currentCategory.id === 'fans';
                            const currentFans = (selectedComponents['fans'] as ComponentOption[]) || [];
                            const fanCount = isFans ? currentFans.filter(f => f.id === option.id).length : 0;
                            const isSelected = isFans ? fanCount > 0 : selectedComponents[currentCategory.id]?.id === option.id;

                            const optBundle = !String(option.id).startsWith('no-part-')
                              ? bundles.find((b: any) => b.parts.some((bp: any) => String(bp.part._id) === String(option.id)))
                              : null;
                            const isBundleActive = optBundle ? getActiveBundles(selectedComponents).some((b: any) => b._id === optBundle._id) : false;

                            return (
                              <div
                                key={option.id}
                                onClick={() => !isFans && handleSelect(currentCategory.id, option)}
                                className={`group cursor-pointer p-4 md:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                                  isSelected
                                    ? 'bg-[#161616] border-white ring-1 ring-white/20 shadow-lg'
                                    : 'bg-[#111111] border-white/5 hover:border-white/20'
                                }`}
                              >
                                <div className="flex-1 min-w-0" onClick={() => isFans && handleSelect(currentCategory.id, option)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-semibold truncate ${
                                      isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'
                                    }`}>{option.name}</h3>
                                    {optBundle && (
                                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        isBundleActive
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {isBundleActive ? 'Bundle Applied' : 'Bundle Deal'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-500 text-sm truncate">{option.description}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="text-lg font-medium text-white">${option.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  
                                  {isFans ? (
                                    <div className="flex items-center gap-3 bg-black/50 rounded-full border border-white/10 px-2 py-1">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleFanChange(option, -1); }}
                                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                      >-</button>
                                      <span className="text-sm font-bold w-4 text-center">{fanCount}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleFanChange(option, 1); }}
                                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                      >+</button>
                                    </div>
                                  ) : (
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? 'border-white bg-white'
                                        : 'border-gray-600 bg-transparent group-hover:border-gray-400'
                                    }`}>
                                      {isSelected && (
                                        <div className="w-2 h-2 rounded-full bg-black" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  if (currentCategory.id === 'cpu') {
                    const intelOptions = options.filter((o: any) => o.name.toLowerCase().includes('intel') || o.description.toLowerCase().includes('intel'));
                    const amdOptions = options.filter((o: any) => o.name.toLowerCase().includes('amd') || o.name.toLowerCase().includes('ryzen') || o.description.toLowerCase().includes('amd') || o.description.toLowerCase().includes('ryzen'));
                    const otherOptions = options.filter((o: any) => !intelOptions.includes(o) && !amdOptions.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('AMD Processors', amdOptions)}
                        {renderOptionsGroup('Intel Processors', intelOptions)}
                        {renderOptionsGroup('Other', otherOptions)}
                      </>
                    );
                  }

                  if (currentCategory.id === 'ram') {
                    // Group by speed
                    const groups: Record<string, any[]> = {};
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));
                    
                    options.forEach((o: any) => {
                      if (o.id.toString().startsWith('no-part-')) return;
                      // Try to find speed in name or specs (e.g., 6000MHz or 6000 MT/s)
                      const speedMatch = o.name.match(/(\d{4})\s*(?:MHz|MT\/s)/i) || (o.specs && o.specs.speed ? [null, o.specs.speed] : null);
                      const speed = speedMatch ? `${speedMatch[1]}` : 'Other';
                      
                      if (!groups[speed]) groups[speed] = [];
                      groups[speed].push(o);
                    });

                    // Target Speeds
                    const targetSpeeds = ['6000', '6200', '6400', '6800', '7200', '7600', '8000', '8200', '8400', '8800'];
                    
                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {targetSpeeds.map(speed => renderOptionsGroup(`${speed} MHz`, groups[speed] || []))}
                        {renderOptionsGroup('Other Speeds', Object.keys(groups).filter(k => !targetSpeeds.includes(k) && k !== 'Other').reduce((acc, k) => [...acc, ...groups[k]], [] as any[]))}
                        {renderOptionsGroup('Other Speeds', groups['Other'] || [])}
                      </>
                    );
                  }

                  if (currentCategory.id === 'gpu') {
                    const rtx5090 = options.filter((o: any) => o.name.includes('5090') || o.description.includes('5090'));
                    const rtx5080 = options.filter((o: any) => o.name.includes('5080') || o.description.includes('5080'));
                    const rtx5070 = options.filter((o: any) => o.name.includes('5070') || o.description.includes('5070'));
                    const rtx5060 = options.filter((o: any) => o.name.includes('5060') || o.description.includes('5060'));
                    const rtx5050 = options.filter((o: any) => o.name.includes('5050') || o.description.includes('5050'));
                    
                    const specified = [...rtx5090, ...rtx5080, ...rtx5070, ...rtx5060, ...rtx5050];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('RTX 5050', rtx5050)}
                        {renderOptionsGroup('RTX 5060', rtx5060)}
                        {renderOptionsGroup('RTX 5070', rtx5070)}
                        {renderOptionsGroup('RTX 5080', rtx5080)}
                        {renderOptionsGroup('RTX 5090', rtx5090)}
                        {renderOptionsGroup('Other Graphics Cards', otherOptions)}
                      </>
                    );
                  }

                  if (currentCategory.id === 'motherboard') {
                    // Filter just exactly what requested
                    const b850Exact = options.filter((o: any) => o.name.includes('B850') || o.description.includes('B850'));
                    const x870Exact = options.filter((o: any) => o.name.includes('X870') || o.description.includes('X870'));
                    const z890Exact = options.filter((o: any) => o.name.includes('Z890') || o.description.includes('Z890'));

                    const specified = [...b850Exact, ...x870Exact, ...z890Exact];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('AMD B850', b850Exact)}
                        {renderOptionsGroup('AMD X870', x870Exact)}
                        {renderOptionsGroup('Intel Z890', z890Exact)}
                        {renderOptionsGroup('Other Motherboards', otherOptions)}
                      </>
                    );
                  }

                  if (currentCategory.id === 'storage') {
                    const tb8 = options.filter((o: any) => o.name.includes('8TB') || o.description.includes('8TB'));
                    const tb4 = options.filter((o: any) => o.name.includes('4TB') || o.description.includes('4TB'));
                    const tb2 = options.filter((o: any) => o.name.includes('2TB') || o.description.includes('2TB'));
                    const tb1 = options.filter((o: any) => (o.name.includes('1TB') || o.description.includes('1TB')) && !o.name.includes('11TB'));
                    
                    const specified = [...tb8, ...tb4, ...tb2, ...tb1];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('1TB Storage', tb1)}
                        {renderOptionsGroup('2TB Storage', tb2)}
                        {renderOptionsGroup('4TB Storage', tb4)}
                        {renderOptionsGroup('8TB Storage', tb8)}
                        {renderOptionsGroup('Other Storage', otherOptions)}
                      </>
                    );
                  }

                  if (currentCategory.id === 'psu') {
                    const getWattage = (o: any) => {
                      if (o.specs?.wattage) return String(o.specs.wattage).replace(/[^0-9]/g, '');
                      const match = (o.name + ' ' + (o.description || '')).match(/(\d+)\s*w/i);
                      return match ? match[1] : null;
                    };

                    const w1600 = options.filter((o: any) => getWattage(o) === '1600');
                    const w1200 = options.filter((o: any) => getWattage(o) === '1200');
                    const w1000 = options.filter((o: any) => getWattage(o) === '1000');
                    const w850 = options.filter((o: any) => getWattage(o) === '850');
                    
                    const specified = [...w1600, ...w1200, ...w1000, ...w850];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('850W Power Supplies', w850)}
                        {renderOptionsGroup('1000W Power Supplies', w1000)}
                        {renderOptionsGroup('1200W Power Supplies', w1200)}
                        {renderOptionsGroup('1600W Power Supplies', w1600)}
                        {renderOptionsGroup('Other Power Supplies', otherOptions)}
                      </>
                    );
                  }

                  if (currentCategory.id === 'cooler') {
                    const getRadSize = (o: any) => {
                      if (o.specs?.radiatorSize) return String(o.specs.radiatorSize).replace(/[^0-9]/g, '');
                      const match = (o.name + ' ' + (o.description || '')).match(/(\d+)mm/i);
                      return match ? match[1] : null;
                    };

                    const mm420 = options.filter((o: any) => getRadSize(o) === '420');
                    const mm360 = options.filter((o: any) => getRadSize(o) === '360');
                    const mm280 = options.filter((o: any) => getRadSize(o) === '280');
                    const mm240 = options.filter((o: any) => getRadSize(o) === '240');
                    const mm120 = options.filter((o: any) => getRadSize(o) === '120');
                    
                    const specified = [...mm420, ...mm360, ...mm280, ...mm240, ...mm120];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('240mm Coolers', mm240)}
                        {renderOptionsGroup('280mm Coolers', mm280)}
                        {renderOptionsGroup('360mm Coolers', mm360)}
                        {renderOptionsGroup('420mm Coolers', mm420)}
                        {renderOptionsGroup('Other Coolers', [...mm120, ...otherOptions])}
                      </>
                    );
                  }

                  if (currentCategory.id === 'fans') {
                    const getFanSize = (o: any) => {
                      if (o.specs?.size) return String(o.specs.size).replace(/[^0-9]/g, '');
                      const match = (o.name + ' ' + (o.description || '')).match(/(\d+)mm/i);
                      return match ? match[1] : null;
                    };

                    const mm360 = options.filter((o: any) => getFanSize(o) === '360');
                    const mm280 = options.filter((o: any) => getFanSize(o) === '280');
                    const mm240 = options.filter((o: any) => getFanSize(o) === '240');
                    const mm140 = options.filter((o: any) => getFanSize(o) === '140');
                    const mm120 = options.filter((o: any) => getFanSize(o) === '120');
                    
                    const specified = [...mm360, ...mm280, ...mm240, ...mm140, ...mm120];
                    const otherOptions = options.filter((o: any) => !specified.includes(o) && !o.id.toString().startsWith('no-part-'));
                    const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));

                    return (
                      <>
                        {renderOptionsGroup('', skipOption)}
                        {renderOptionsGroup('120mm Case Fans', mm120)}
                        {renderOptionsGroup('140mm Case Fans', mm140)}
                        {renderOptionsGroup('240mm Case Fans', mm240)}
                        {renderOptionsGroup('280mm Case Fans', mm280)}
                        {renderOptionsGroup('360mm Case Fans', mm360)}
                        {renderOptionsGroup('Other Case Fans', otherOptions)}
                      </>
                    );
                  }

                  // Default rendering for unhandled categories
                  const skipOption = options.filter((o: any) => o.id.toString().startsWith('no-part-'));
                  const standardOptions = options.filter((o: any) => !o.id.toString().startsWith('no-part-'));

                  return (
                    <>
                      {renderOptionsGroup('', skipOption)}
                      {renderOptionsGroup('', standardOptions)}
                    </>
                  );
                })()}
              </div>

              {/* Navigation Bar */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`text-sm font-bold flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                    currentStep === 0 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>

                <button
                  onClick={handleNextStep}
                  className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {currentStep === componentCategories.length - 1 ? 'Review Build' : (currentCategory.id === 'fans' && (!selectedComponents.fans || selectedComponents.fans.length === 0) ? 'Skip Fans' : 'Continue')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-48 space-y-6">
              {/* FPS Estimation Card */}
              {fortniteFPS && (
                <div className="bg-[#111111] rounded-3xl border border-white/5 p-6 overflow-hidden relative text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-50" />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <h3 className="text-3xl font-black text-emerald-300 tracking-tight leading-none drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] mb-2">
                      {fortniteFPS}+ FPS
                    </h3>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded shadow-[0_0_15px_rgba(52,211,153,0.2)] leading-none inline-block">
                        Competitive &bull; 1080p
                      </span>
                      <div className="text-emerald-400/70 text-xs sm:text-sm font-bold uppercase tracking-wider drop-shadow-[0_0_3px_rgba(52,211,153,0.1)] leading-none mt-1">
                        {fortniteFPS >= 300 ? '360Hz+' : fortniteFPS >= 200 ? '240–360Hz' : '144–240Hz'}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                    Estimated performance. Actual FPS may vary.
                  </p>
                </div>
              )}

              {/* Build Summary Card */}
              <div className="bg-[#111111] rounded-3xl border border-white/5 p-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-50" />
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Build Summary</h3>
                </div>
                
                {/* Selected Case */}
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case</div>
                    <div className="text-sm text-gray-200 line-clamp-2">{selectedCase.name}</div>
                    
                    <div className="mt-2 flex gap-2">
                      <button 
                        onClick={() => { setSelectedCaseColor('Black'); saveDraftBuild(selectedComponents, 'Black'); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${selectedCaseColor === 'Black' ? 'border-emerald-400 scale-110' : 'border-gray-600 hover:border-gray-400'}`}
                        style={{ backgroundColor: '#111' }}
                        title="Black"
                      />
                      <button 
                        onClick={() => { setSelectedCaseColor('White'); saveDraftBuild(selectedComponents, 'White'); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${selectedCaseColor === 'White' ? 'border-emerald-400 scale-110' : 'border-gray-600 hover:border-gray-400'}`}
                        style={{ backgroundColor: '#f3f4f6' }}
                        title="White"
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-white">${selectedCase.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>

                  {/* Selected Components */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(selectedComponents).length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No parts selected yet.</p>
                    ) : (
                      Object.entries(selectedComponents).map(([categoryId, component]) => {
                        const category = componentCategories.find(c => c.id === categoryId);
                        if (!category) return null;
                        return renderComponentSummary(categoryId, component, category.name);
                      })
                    )}
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Service</div>
                        <div className="text-sm text-gray-300 line-clamp-1">System Integration & Validation</div>
                      </div>
                      <div className="text-sm text-white">${calculatedBuildFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                {/* Total */}
                <div className="pt-4 border-t border-white/10">
                  {bundleSavings > 0 && (
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-emerald-400 font-medium">Bundle Deal Savings</span>
                      <span className="text-emerald-400 font-semibold">-${bundleSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400">Total Price</span>
                    <span className="text-2xl font-bold text-emerald-400">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex justify-end items-center flex-wrap text-xs gap-1">
                      <span className="text-gray-400">or</span> <span className="text-blue-400 font-medium">${Math.ceil((totalPrice * 1.0999) / 24)}/mo</span> <span className="text-gray-400">with</span> <img src="https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png" alt="Affirm" className="h-[12px] inline-block -mt-0.5 translate-y-[1px]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Guarantees */}
              <div className="bg-[#111111] rounded-3xl border border-white/5 p-6">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">The Standard</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-0.5 text-sm" />
                    <span className="text-sm text-gray-400">Professional assembly & routing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-0.5 text-sm" />
                    <span className="text-sm text-gray-400">3-year comprehensive warranty</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-0.5 text-sm" />
                    <span className="text-sm text-gray-400">Stress tested before shipping</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      <BuildRequestModal 
        isOpen={isBuildRequestModalOpen} 
        onClose={() => setIsBuildRequestModalOpen(false)} 
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        duration={toast.duration}
      />

      {/* Review Build Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl max-h-[90vh] bg-[#111] rounded-3xl border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Your Custom Build</h2>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {fortniteFPS && (
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">Estimated Performance</h4>
                    <span className="text-xs text-gray-400">Competitive &bull; 1080p</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{fortniteFPS}+ FPS</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Case</span>
                <span className="font-medium text-white">{selectedCase.name} ({selectedCaseColor})</span>
              </div>

              {Object.entries(selectedComponents).map(([categoryId, component]) => {
                if (!component || (Array.isArray(component) && component.length === 0)) return null;
                const category = componentCategories.find(c => c.id === categoryId);
                const catName = category?.name || categoryId;
                
                if (Array.isArray(component)) {
                  const counts = new Map<string | number, { comp: ComponentOption; count: number }>();
                  component.forEach(c => {
                    const existing = counts.get(c.id);
                    if (existing) existing.count += 1;
                    else counts.set(c.id, { comp: c, count: 1 });
                  });
                  return Array.from(counts.values()).map(({ comp, count }, idx) => (
                    <div key={`${categoryId}-${idx}`} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{catName}</span>
                      <span className="font-medium text-white">{count > 1 ? `${count}x ` : ''}{comp.description ? `${comp.description} ` : ''}{comp.name}</span>
                    </div>
                  ));
                }
                
                return (
                  <div key={categoryId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{catName}</span>
                    <span className="font-medium text-white">
                      {String(component.id).startsWith('no-part-') 
                        ? component.name.split(' - ')[0] 
                        : `${component.description ? `${component.description} ` : ''}${component.name}`}
                    </span>
                  </div>
                );
              })}

              <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5">
                <span className="text-gray-400">Build Service</span>
                <span className="font-medium text-emerald-400">Included</span>
              </div>
              
              <div className="flex flex-col pt-4 border-t border-white/10">
                {bundleSavings > 0 && (
                  <div className="flex justify-between items-center text-sm mb-2 text-emerald-400 font-medium">
                    <span>Bundle Deal Savings</span>
                    <span>-${bundleSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {totalPrice > 0 && (
                  <div className="flex justify-end items-center flex-wrap text-xs mt-1 gap-1">
                    <span>or</span> <span className="text-blue-400 font-medium">${Math.ceil((totalPrice * 1.0999) / 24)}/mo</span> <span>with</span> <img src="https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png" alt="Affirm" className="h-[12px] inline-block -mt-0.5 translate-y-[1px]" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white/5 border-t border-white/10 rounded-b-3xl space-y-3">
              <button 
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                onClick={() => {
                  const partsMap = new Map<string | number, { quantity: number; partType: string }>();
                  
                  Object.entries(selectedComponents).forEach(([catId, comp]) => {
                    const items = Array.isArray(comp) ? comp : [comp];
                    items.forEach(item => {
                      const existing = partsMap.get(item.id);
                      if (existing) {
                        existing.quantity += 1;
                      } else {
                        partsMap.set(item.id, { quantity: 1, partType: 'Component' });
                      }
                    });
                  });

                  const parts = Array.from(partsMap.entries()).map(([partId, data]) => ({
                    part: String(partId).startsWith('no-part-') ? undefined : partId,
                    quantity: data.quantity,
                    partType: data.partType
                  }));
                  
                    parts.push({
                      part: selectedCase.id,
                      quantity: 1,
                      partType: 'Case'
                    });

                    // We only need to trigger a save if we don't already have a valid buildId from the draft auto-saver
                    // In 99% of cases, `saveDraftBuild` has already persisted the build and populated the URL.
                    const finalBuildId = new URLSearchParams(window.location.search).get('buildId');

                    fetch(`${process.env.REACT_APP_API_URL}/custom-builds`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        buildId: finalBuildId || undefined,
                        name: `Custom Build`,
                        baseProduct: baseProductId,
                        parts,
                        frontendSubtotal: subtotal,
                        frontendLaborFee: calculatedBuildFee,
                        frontendTotal: totalPrice,
                        notes: `Case Color: ${selectedCaseColor}`
                      })
                    })
                    .then(res => res.json())
                  .then(buildData => {
                    if (!buildData.customBuild) throw new Error('Failed to create build');
                    
                    let sessionId = localStorage.getItem('cartSessionId');
                    if (!sessionId) {
                      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
                      localStorage.setItem('cartSessionId', sessionId);
                    }
                    
                    return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`)
                      .then(res => res.json())
                      .then(cartData => {
                        const existingItems = cartData.cart?.items || [];
                        const mappedItems = existingItems.map((i: any) => ({
                          product: i.product?._id || i.product,
                          pcPart: i.pcPart?._id || i.pcPart,
                          accessory: i.accessory?._id || i.accessory,
                          customBuild: i.customBuild?._id || i.customBuild,
                          quantity: i.quantity
                        }));
                        
                        mappedItems.push({
                          customBuild: buildData.customBuild._id,
                          quantity: 1
                        });
                        trackEvent('add_to_cart', window.location.pathname + window.location.search, buildData.customBuild._id.toString());
                        
                        return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ items: mappedItems })
                        });
                      });
                  })
                  .then(() => {
                    showToast('Custom build added to cart!', 'success');
                    setTimeout(() => window.location.href = '/cart', 1000);
                  })
                  .catch(err => {
                    console.error(err);
                    showToast('Failed to add to cart.', 'error');
                  });
                }}
              >
                Add to Cart
              </button>
              
              <button 
                onClick={handleShareBuild}
                disabled={isSharing}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 border border-white/10"
              >
                {isSharing ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                {isSharing ? 'Generating Link...' : 'Share Build'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Configurator;

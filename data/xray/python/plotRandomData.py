# plot random data
import sys,os,importlib
sys.path.insert(0,os.path.join('../'))
import xray
importlib.reload(xray)

import numpy as np
import matplotlib.pyplot as plt
import afterglowpy as grb
import astropy.constants as C
import astropy.units as u
plt.ion()

params={
    'jetType':{ # Code for type of jet.
        'type':'select',
        'vals':[grb.jet.Gaussian,grb.jet.Gaussian,grb.jet.TopHat,grb.jet.Spherical]
    },
    'specType':{'type':'fixed','vals':0}, # Basic Synchrotron Emission Spectrum
    # 'd_L':{ # Luminosity distance to burst, in cm.
    #     'type':'log-uniform',
    #     'vals':[1e7*u.lyr.to(u.cm),1e9*u.lyr.to(u.cm)]
    # },
    'd_L':{# Luminosity distance to burst, in cm.
        'type':'fixed','vals':1.2e8*u.lyr.to(u.cm)}, 
    'thetaObs':{ # Viewing angle in radians (jet-only)
        'type':'uniform',
        'vals':[np.deg2rad(0),np.deg2rad(40)]
    },
    'thetaCore':{ # Half-opening angle in radians (jet-only)
        'type':'dep',
        'dep':'jetType',
        'vals':[0.05,np.deg2rad(20),0.05,0.05]
    },
    'thetaWing':{'type':'fixed','vals':0.4},    # Outer truncation angle (jet only)
    'E0':{ # Isotropic-equivalent energy along the jet axis in ergs (jet-only)
        'type':'dep',
        'dep':'jetType',
        'vals':[1e53,1e52,1e53,1e52]
    },
    'n0':{'type':'fixed','vals':1e-3},    # circumburst density in cm^{-3}
    'xi_N':{'type':'fixed','vals':1.0},    # Fraction of electrons accelerated
    'epsilon_e':{ # epsilon_e
        'type':'dep',
        'dep':'jetType',
        'vals':[0.1,0.1,0.1,10**-2.7]
    },
    'epsilon_B':{ #  Power law index of relativistic electron energy distribution
        'type':'dep',
        'dep':'jetType',
        'vals':[0.0001,0.0001,0.0001,10**-2.5]
    },
    'p':{ # Power law index of relativistic electron energy distribution,
        'type':'dep',
        'dep':'jetType',
        'vals':[2.2,2.2,2.2,2.156]
    },
    'uMax':{ # Maximum 4-velocity of outflow (spherical only)
        'type':'fixed','vals':8.5,'vdep':'jetType','valid':[0,0,0,1]}, 
    'uMin':{ # Minimum 4-velocity of outflow (spherical only)
        'type':'fixed','vals':1e-4,'vdep':'jetType','valid':[0,0,0,1]}, 
    'k':{ # Power law index of outflow's energy (spherical only) distribution.
        'type':'fixed','vals':5.6,'vdep':'jetType','valid':[0,0,0,1]}, 
    'MFast_solar':{ # Mass of material at u_max in solar masses (spherical only)
        'type':'fixed','vals':10**-6.5,'vdep':'jetType','valid':[0,0,0,1]}, 
    'Er':{ #Normalization of outflow's energy distribution in ergs (spherical only)
        'type':'fixed','vals':3e53,'vdep':'jetType','valid':[0,0,0,1]}, 
}

def getParams(parIn):
    parOut={}
    sel={}
    for p in parIn:
        param=parIn[p]
        if 'vdep' in param:
            if not param['valid'][sel[param['vdep']]]:
                print('skipping',p)
                continue
        print(p)
        if param['type']=='fixed':
            parOut[p]=param['vals']
        elif param['type']=='uniform':
            parOut[p]=param['vals'][0]+np.random.random()*(param['vals'][1]-param['vals'][0])
        elif param['type']=='log-uniform':
            parOut[p]=param['vals'][0]+np.exp(np.log(param['vals'][0])+np.random.random()*(np.log(param['vals'][1])-np.log(param['vals'][0])))
        elif param['type']=='select':
            i=np.random.random()
            sel[p]=int(np.floor(i*(len(param['vals']))))
            # print(p,len(param['vals']),i*(len(param['vals'])),sel[p])
            parOut[p]=param['vals'][sel[p]]
        elif param['type']=='dep':
            parOut[p]=param['vals'][sel[param['dep']]]
        else:
            print('ERROR: invalid type for {}'.format(p),parIn[p])
    return(parOut)
    
par=getParams(params)
print(par)
# fsfDF
# Time and Frequencies
Nt = 100
Nnu = 1
t = np.empty((Nt, Nnu))
nu = np.empty((Nt, Nnu))

ta = 1.00 * grb.day2sec
tb = 3.0e4 * grb.day2sec
nuR = 6.0e9
nuI = 1.0e14
nuO = 1.0e15
nuX = 1.0e18

t[:, :] = np.geomspace(ta, tb, num=Nt)[:, None]
nu[:, 0] = nuX
tday = t * grb.sec2day
tMin=1
tMax=3000

ndata=10
tdata=np.empty((ndata,1))
nudata=np.empty((ndata,1))
logtrange=np.log(tMax)-np.log(tMin)
logdt=logtrange/(ndata+1)
logdatat=np.arange(np.log(tMin)+logdt,np.log(tMax),logdt)
logdatatrand=np.random.normal(logdatat,logdt/2)
datat0=np.geomspace(tMin,tMax,num=ndata+2)
# tdata=np.exp(logdatatrand)
tdata[:,0]=np.exp(logdatatrand)*grb.day2sec
nudata=np.empty((ndata,1))
nudata[:,0]=nuX



models={'random':{'pars':par}}
models['random']['legend']='Random'
# models['random']['label2']=r'${}: theta={:.1f}^\circ$'.format(par['jetType'],np.rad2deg(par['thetaObs']))

models['random']['Fnu']=grb.fluxDensity(t, nu, **par)
dataFnu=grb.fluxDensity(tdata, nudata, **par)
for i in range(ndata):
    print(tdata[i,0],dataFnu[i,0])
    
fig=plt.figure(1,figsize=(5.5,5))
plt.clf()
axind=fig.gca()

m='random'
# legendloc=models[m].get('legendloc','upper left')
label=models[m].get('legend',m)
color=models[m].get('color',None)
xray.plotModels(axind,tday,models[m],label=label,fact=1e3,
    ylabel=r'Flux ($\mu$Jy)',xlim=[tMin,tMax],alpha=0,showlegend=False)
ylim=[1e-6,1e4]
# ylimdef=axind.get_ylim()
# ylim=[np.max([ylim[0],ylimdef[0]]),np.min([ylim[1],ylimdef[1]])]
axind.set_ylim(ylim)
if ylim[1]/ylim[0]>1e8:
    yticks=np.array([1e-6,1e-4,1e-2,1,1e2,1e4])
    yticklabels=np.array(["0.000001","0.0001","0.01","1","100","10,000"])
else:
    yticks=np.array([1e-6,1e-5,1e-4,1e-3,1e-2,1e-1,1,1e1,1e2,1e3,1e4])
    yticklabels=np.array(["0.000001","0.00001","0.0001","0.001","0.01","0.1","1","10","100","1,000","10,000"])
axind.set_yticks(yticks[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
axind.set_yticklabels(yticklabels[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])

axind.plot(tdata[:,0]*grb.sec2day,dataFnu[:,0]*1e3,'x')

fig.tight_layout()
plt.show()

import os,sys
import numpy as np
from pycbc.waveform import get_td_waveform
from matplotlib import pyplot as plt
import pandas as pd

plt.ion()

if os.getcwd().split('/')[-1]=='python':
    # in python director
    sys.path.append("./")
    dataDir='../data'
    plotDir='../plots'
else:
    # assuming directory above python directory
    sys.path.append("./python")
    dataDir='data'
    plotDir='plots'
import mmapy

meta={
    'Gaussian':{'label':'Tapered Jet','color':'#0000ff'},
    'Wide':{'label':'Broad Jet','color':'#009600'},
    'TopHat':{'label':'Sharp-edged Jet','color':'#ffff00'},
    'Spherical':{'label':'Spherical cocoon','color':'#ff0000'}
    }

inclinations=[
    {'inc':0},
    {'inc':10},
    {'inc':20},
    {'inc':30},
    {'inc':40},
    {'inc':50}
]
t0=1
t1=3e4
Nt=100
nu=[1.0e18]

#load models
models=mmapy.xray.loadModels(meta,fileIn='xray_catalogue.json')
# nplot=len(inclinations)

figgrid, axes = plt.subplots(2,3,figsize=(15,10),clear=True,sharex='all',sharey='all')

def plotModels(ax,models,ylim=None,xlim=[1,3000],
    showlegend=True,grid=True,ylabel=r'Flux ($\mu$Jy)',alpha=0.5,nolabel=False,**kwargs):
    
    for m in models:
        mod=models[m]
        col=mod.meta.get('color',None)
        lw=mod.meta.get('lw',10)
        alpha=mod.meta.get('alpha',0.5)
        ax.plot(mod.getTimeArray('day'),mod.getFlux(),color=col,lw=lw,alpha=alpha,label=mod.name)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlim(xlim)
    if ylim:
        ax.set_ylim(ylim)
    
    if showlegend:
        legendloc=kwargs.get('legendloc','upper left')
        if legendloc!='none':
            ax.legend(loc=legendloc)
    dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
    dayticks=dayticks[np.where((dayticks>=xlim[0])&(dayticks<=xlim[1]))]
    ax.set_xticks(dayticks)
    ax.set_xticklabels(dayticks)
    ax.grid(grid)
    ax.annotate(models[m].getInclination(units='deg'),(0.95,0.95),xycoords='axes fraction',va='top',ha='right',fontsize='large')
    return

def plotInset(ax,model,thetaCore=None,thetaWing=0.4):
    # print('inset')
    ax.set_xlim(-3,3)
    ax.set_ylim(-1.5,1.5)
    ax.set_aspect('equal')
    ax.axis('off')
    
    jT=model.getJetType()
    thetaObs=model.getInclination(units='rad')
    if not thetaCore:
        thetaCore=model.getParam('thetaCore')
    jR=2
    if jT==0:
        for tt in np.arange(10):
            th=thetaWing-tt*0.1*(thetaWing)
            col=1-tt*0.07
            ax.fill([0,jR*np.cos(th),jR*np.cos(th)],
                [0,jR*np.sin(th),-jR*np.sin(th)],
                color=(col,col,col))
            ax.fill([0,-jR*np.cos(th),-jR*np.cos(th)],
                [0,jR*np.sin(th),-jR*np.sin(th)],
                color=(col,col,col))
    elif jT==-1:
        ax.fill([0,jR*np.cos(thetaCore),jR*np.cos(thetaCore)],
            [0,jR*np.sin(thetaCore),-jR*np.sin(thetaCore)],color=(col,col,col))
        ax.fill([0,-jR*np.cos(thetaCore),-jR*np.cos(thetaCore)],
            [0,jR*np.sin(thetaCore),-jR*np.sin(thetaCore)],color=(col,col,col))
    elif jT==3:
        th=np.arange(0,361,2)
        xc=np.sin(np.deg2rad(th))
        yc=np.cos(np.deg2rad(th))
        for r in np.arange(1,0,-0.1):
            col=0.3+r*0.7
            ax.fill(r*xc,r*yc,color=(0.3,0.3,0.3),alpha=1-col)
        
    dx=np.cos(thetaObs)
    dy=-np.sin(thetaObs)
    if thetaObs>np.deg2rad(30):
        aR=1.8
    else:
        aR=2.8
    ax.arrow(aR*dx,aR*dy,-0.7*dx,-0.7*dy,width=0.1,length_includes_head=True,color='r')
    ax.plot([0,(aR-1)*dx],[0,(aR-1)*dy],ls=':',c='r')
    
nInc=len(inclinations)
for i in range(nInc):
    inc=inclinations[i]
    inc['models']={}
    for m in models:
        print(m)
        name='{}'.format(m)
        mod=mmapy.xray.XrayModel(name,models[m].params,meta=models[m].meta)
        mod.setThetaObs(inc['inc'])
        mod.setTimeArr(t0,t1,Nt)
        mod.setNuArr(nu)
        mod.calculate()
        print('calculated')
        inc['models'][name]=mod
        
    for m in inc['models']:
        if m.find('Gaussian')>=0:
            gmod=m
    mod=inc['models'][gmod]
    x=int(i/3)
    y=i%3
    ax=axes[x,y]
    plotModels(ax,inc['models'],ylim=[1e-6,1e4])
    # print(inc['models']['Gaussian'].getInclination(units='deg'))
    axins=ax.inset_axes([0.65,0.75,0.3,0.2])
    plotInset(axins,inc['models'][gmod])
    
    # for m in inc['models']:
    #     mod=inc['models'][m]
    #     col=mod.meta.get('color',None)
    #     lw=mod.meta.get('lw',10)
    #     alpha=mod.meta.get('alpha',10)
    #     ax.plot(mod.getTimeArray('day'),mod.getFlux(),color=col,lw=lw,alpha=alpha)
    # 
    #     plt.
    #     dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
    #     dayticks=dayticks[np.where((dayticks>=xlim[0])&(dayticks<=xlim[1]))]
    #     ax.set_xticks(dayticks)
    #     ax.set_xticklabels(dayticks)
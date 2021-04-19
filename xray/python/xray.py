import numpy as np

def plotModels(ax,tday,models,ylim=[1e-6,1e8],xlim=[1,3000],fact=1,label=None,
    showlegend=True,grid=True,ylabel=r'Flux (nJy)',**kwargs):

    if isinstance(models,dict):
        mods=[models]
    else:
        mods=models
    
    # label=kwargs.get('label',None)
    for m in range(len(mods)):
        color=mods[m].get('color',None)
        # label=mods[m].get('legend',None)
        # ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=label)
        # print ('label:',label)
        ax.plot(tday[:,0], mods[m]['Fnu'][:,0]*fact, ls='-', label=label)
        ax.set_xscale('log')
        ax.set_yscale('log')
        ax.set_ylim(ylim[0],ylim[1])
        ax.set_xlabel('Time (days)')
        ax.set_ylabel(ylabel)
        # ax.set_ylabel(r'$F_\nu$ (mJy)')
        ax.set_xlim(xlim[0],xlim[1])
        dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
        dayticks=dayticks[np.where((dayticks>=xlim[0])&(dayticks<=xlim[1]))]
        ax.set_xticks(dayticks)
        ax.set_xticklabels(dayticks)
        # ax.set_xticklabels(['1 day','1 week','1 month','6 months','1 year'])
        if 'label1' in mods[m]:
            ax.annotate(mods[m]['label1'],(0.01,0.95),xycoords='axes fraction',va='top')
        if 'label2' in mods[m]:
            ax.annotate(mods[m]['label2'],(0.95,0.95),xycoords='axes fraction',va='top',ha='right',fontsize='large')
        ax.grid(grid)
        if showlegend:
            legendloc=kwargs.get('legendloc','lower left')
            ax.legend(loc=legendloc)
    
    return
    
def plotInset(ax,model,thetaObs=0,thetaCore=0.1,thetaWing=0.4):
    # print('inset')
    ax.set_xlim(-3,3)
    ax.set_ylim(-1.5,1.5)
    ax.set_aspect('equal')
    ax.axis('off')
    
    jT=model['pars']['jetType']
    jR=2
    if jT==0:
        for tt in np.arange(10):
            # th=thetaWing-tt*0.1*(thetaWing-thetaCore)
            # col=1-tt*0.05
            th=thetaWing-tt*0.1*(thetaWing)
            col=1-tt*0.07
            ax.fill([0,jR*np.cos(th),jR*np.cos(th)],
                [0,jR*np.sin(th),-jR*np.sin(th)],
                color=(col,col,col))
            ax.fill([0,-jR*np.cos(th),-jR*np.cos(th)],
                [0,jR*np.sin(th),-jR*np.sin(th)],
                color=(col,col,col))
        # ax.fill([0,np.cos(thetaCore),np.cos(thetaCore)],[0,np.sin(thetaCore),-np.sin(thetaCore)],color='#555555')
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
    # if jT==0 or jT==-1:
    #     ax.annotate(r'$\theta={:.0f}^\circ$'.format(np.rad2deg(thetaObs)),[2*dx,2*dy],va='center')
        
    return
    
def plotData(ax):
    import pandas as pd
    dataIn=pd.read_csv('data/GW170817_xray.csv')
    # print(dataIn['Time'],dataIn['Flux Density Jy'])
    ax.plot(dataIn['Time'],dataIn['Flux Density Jy']*1e6,'x',label='Data')
    return
    
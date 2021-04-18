import numpy as np

def plotModels(ax,tday,models,**kwargs):

    if isinstance(models,dict):
        mods=[models]
    else:
        mods=models
    
    label=kwargs.get('label',None)
    ylim=kwargs.get('ylim',[1e-6,1e8])
    fact=kwargs.get('fact',1)
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
        ax.set_ylabel('Flux (nJy)')
        # ax.set_ylabel(r'$F_\nu$ (mJy)')
        dayticks=[1,3,10,30,100,300,1000]
        ax.set_xticks(dayticks)
        ax.set_xticklabels(dayticks)
        # ax.set_xticklabels(['1 day','1 week','1 month','6 months','1 year'])
        if 'label1' in mods[m]:
            ax.annotate(mods[m]['label1'],(0.01,0.95),xycoords='axes fraction',va='top')
        if 'label2' in mods[m]:
            ax.annotate(mods[m]['label2'],(0.95,0.95),xycoords='axes fraction',va='top',ha='right',fontsize='large')
        ax.grid(True)
        ax.legend(loc='lower left')
    
    return
    
def plotInset(ax,model,thetaObs,thetaCore=0.1,thetaWing=0.4):
    print('inset')
    ax.set_xlim(0,2)
    ax.set_ylim(-1,1)
    ax.axis('off')
    
    if model['pars']['jetType']==0:
        for tt in np.arange(10):
            th=thetaWing-tt*0.1*(thetaWing-thetaCore)
            col=1-tt*0.05
            ax.fill([0,np.cos(th),np.cos(th)],[0,np.sin(th),-np.sin(th)],color=(col,col,col))
    ax.fill([0,np.cos(thetaCore),np.cos(thetaCore)],[0,np.sin(thetaCore),-np.sin(thetaCore)],color='#555555')
    dx=np.cos(thetaObs)
    dy=-np.sin(thetaObs)
    ax.arrow(1.8*dx,1.8*dy,-0.7*dx,-0.7*dy,width=0.1,length_includes_head=True,color='r')
    ax.plot([0,dx],[0,dy],ls=':',c='r')
    ax.annotate(r'$\theta={:.0f}^\circ$'.format(np.rad2deg(thetaObs)),[2*dx,2*dy],va='center')
    
    return
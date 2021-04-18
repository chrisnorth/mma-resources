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
    

import os
import numpy as np
import matplotlib.pyplot as plt
import afterglowpy as grb
import astropy.constants as C
import astropy.units as u
plt.ion()

plotDir='plots'

# Jet Parameters
Z = {'jetType':     grb.jet.Gaussian,     # Gaussian jet
     'specType':    0,                  # Basic Synchrotron Emission Spectrum
     # 'thetaObs':    0.3,   # Viewing angle in radians
     'E0':          1.0e53, # Isotropic-equivalent energy in erg
     'thetaCore':   0.05,    # Half-opening angle in radians
     'thetaWing':   0.4,    # Outer truncation angle
     'n0':          1.0e-3,    # circumburst density in cm^{-3}
     'p':           2.2,    # electron energy distribution index
     'epsilon_e':   0.1,    # epsilon_e
     'epsilon_B':   0.0001,   # epsilon_B
     'xi_N':        1.0,    # Fraction of electrons accelerated
     'd_L':         44*u.Mpc.to(u.cm), # Luminosity distance in cm
     'z':           0.01}   # redshift


models={
    'Gaussian-0-1Gly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=0^\circ$','plot':0,'legend':r'$D=$1bn ly',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
    'Gaussian-0-100Mly':{'color':'orange','plot':0,'legend':r'$D=$100 Mly',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e8*u.lyr.to(u.cm)}},
    'Gaussian-0-10Mly':{'color':'green','plot':0,'legend':r'$D=$10 Mly',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e7*u.lyr.to(u.cm)}},
        
    'Gaussian-10-1Gly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=10^\circ$','plot':1,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
    'Gaussian-10-100Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=10^\circ$','plot':1,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e8*u.lyr.to(u.cm)}},
    'Gaussian-10-10Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=10^\circ$','plot':1,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e7*u.lyr.to(u.cm)}},
        
    'Gaussian-20-1Gly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=20^\circ$','plot':2,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    'Gaussian-20-100Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=20^\circ$','plot':2,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e8*u.lyr.to(u.cm)}},
    'Gaussian-20-10Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=20^\circ$','plot':2,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e7*u.lyr.to(u.cm)}},
    
    'Gaussian-30-1Gly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=30^\circ$','plot':3,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}},
    'Gaussian-30-100Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=30^\circ$','plot':3,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e8*u.lyr.to(u.cm)}},
    'Gaussian-30-10Mly':{'label1':r'$D=$1bn ly','label2':r'Gaussian $\theta=30^\circ$','plot':3,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e7*u.lyr.to(u.cm)}},
    
    'TopHat-0-1Gly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=0^\circ$','plot':4,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
    'TopHat-0-100Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=0^\circ$','plot':4,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e8*u.lyr.to(u.cm)}},
    'TopHat-0-10Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=0^\circ$','plot':4,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e7*u.lyr.to(u.cm)}},
    
    'TopHat-10-1Gly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=10^\circ$','plot':5,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
    'TopHat-10-100Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=10^\circ$','plot':5,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e8*u.lyr.to(u.cm)}},
    'TopHat-10-10Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=10^\circ$','plot':5,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e7*u.lyr.to(u.cm)}},
    
    'TopHat-20-1Gly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=20^\circ$','plot':6,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    'TopHat-20-100Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=20^\circ$','plot':6,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e8*u.lyr.to(u.cm)}},
    'TopHat-20-10Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=20^\circ$','plot':6,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e7*u.lyr.to(u.cm)}},
    
    'TopHat-30-1Gly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=30^\circ$','plot':7,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}},
    'TopHat-30-100Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=30^\circ$','plot':7,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e8*u.lyr.to(u.cm)}},
    'TopHat-30-10Mly':{'label1':r'$D=$1bn ly','label2':r'TopHat $\theta=30^\circ$','plot':7,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e7*u.lyr.to(u.cm)}},
}

models={
    'Gaussian-0-1Gly':{'label1':r'$D=$1bn ly','label2':r'Tapered beam $\theta=0^\circ$','plot':0,'legend':r'$D=$1bn ly',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
        
    'Gaussian-10-1Gly':{'label1':r'$D=$1bn ly','label2':r'Tapered beam $\theta=10^\circ$','plot':1,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
        
    'Gaussian-20-1Gly':{'label1':r'$D=$1bn ly','label2':r'Tapered beam $\theta=20^\circ$','plot':2,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    
    'Gaussian-30-1Gly':{'label1':r'$D=$1bn ly','label2':r'Tapered beam $\theta=30^\circ$','plot':3,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}},
    
    'TopHat-0-1Gly':{'label1':r'$D=$1bn ly','label2':r'Sharp-edged $\theta=0^\circ$','plot':4,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
    
    'TopHat-10-1Gly':{'label1':r'$D=$1bn ly','label2':r'Sharp-edged beam $\theta=10^\circ$','plot':5,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
    
    'TopHat-20-1Gly':{'label1':r'$D=$1bn ly','label2':r'Sharp-edged beam $\theta=20^\circ$','plot':6,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    
    'TopHat-30-1Gly':{'label1':r'$D=$1bn ly','label2':r'Sharp-edged beam $\theta=30^\circ$','plot':7,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}}
}

# Time and Frequencies
Nt = 100
Nnu = 1
t = np.empty((Nt, Nnu))
nu = np.empty((Nt, Nnu))

ta = 1.00 * grb.day2sec
tb = 3.0e3 * grb.day2sec
nuR = 6.0e9
nuI = 1.0e14
nuO = 1.0e15
nuX = 1.0e18

t[:, :] = np.geomspace(ta, tb, num=Nt)[:, None]
# nu[:, 0] = nuR
# nu[:, 1] = nuO
# nu[:, 2] = nuO
# nu[:, 3] = nuX
nu[:, 0] = nuX
titles=['Radio','IR','Optical','Xray']

# Calculate!
print("Calculate!")
for m in models:
    print('Calculating {}...'.format(m))
    pars={}
    for p in Z:
        pars[p]=Z[p]
    for p in models[m]['pars']:
        if models[m]['pars'][p]=='thetarandom':
            models[m]['pars'][p]=np.deg2rad(np.random.random()*30)
        elif models[m]['pars'][p]=='drandom':
            models[m]['pars'][p]=np.random.random()*800*u.Mpc.to(u.cm)
        pars[p]=models[m]['pars'][p]
    print('theta={:.2f}, d_L={:.2f} Mpc'.format(np.rad2deg(pars['thetaObs']),pars['d_L']*u.cm.to(u.Mpc)))
    models[m]['Fnu'] = grb.fluxDensity(t, nu, **pars)
    # noise=np.random.normal(size=len(t[:,0]))*1e-9
    # models[m]['Fnu'][:,0] = models[m]['Fnu'][:,0]+np.abs(noise)

# Plot!
print("Plot")

tday = t * grb.sec2day

fig, axes = plt.subplots(2,4,num=1,figsize=(25,15),clear=True,sharex='all',sharey='all')
p=0
for m in models:
    plot=models[m]['plot']
    x=int(plot/4)
    y=plot%4
    print(plot,x,y)
    ax=axes[x,y]
    color=models[m].get('color',None)
    label=models[m].get('legend',m)
    # ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=label)
    ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=r'$D=$1bn ly')
    ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e8, ls='-', label=r'$D=$100 Mly')
    ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e10, ls='-', label=r'$D=$10 Mly')
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_ylim(1e-6,1e8)
    ax.set_xlabel('Time (days)')
    ax.set_ylabel('Flux (nJy)')
    # ax.set_ylabel(r'$F_\nu$ (mJy)')
    dayticks=[1,3,10,30,100,300,1000]
    ax.set_xticks(dayticks)
    ax.set_xticklabels(dayticks)
    # ax.set_xticklabels(['1 day','1 week','1 month','6 months','1 year'])
    # if 'label1' in models[m]:
    #     ax.annotate(models[m]['label1'],(0.01,0.95),xycoords='axes fraction',va='top')
    if 'label2' in models[m]:
        ax.annotate(models[m]['label2'],(0.95,0.95),xycoords='axes fraction',va='top',ha='right',fontsize='large')
    ax.grid(True)
    ax.legend(loc='lower left')
    
    ax.inset_axes([0.75,0.75,0.2,0.1])
    
    # ax[x,y].set_title(titles[p])
    # if p==0:
    #     ax[x,y].legend()
    p=p+1

axes[0,0].legend(loc='lower left')

fig.tight_layout()
plt.show()

print("Saving grid_light_curves_beamshape.png")
fig.savefig(os.path.join(plotDir,"grid_light_curves_beamshape.png"))
# plt.close(fig)

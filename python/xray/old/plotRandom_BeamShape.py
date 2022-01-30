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
    '1':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '2':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '3':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '4':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '5':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '6':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '7':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '8':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
    '9':{'pars':{'jetType':'jetrandom','thetaObs':'thetarandom','d_L':'drandom'}},
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
        elif models[m]['pars'][p]=='jetrandom':
            if np.random.random() > 0.5:
                models[m]['pars'][p]=grb.jet.Gaussian
            else:
                models[m]['pars'][p]=grb.jet.TopHat
        pars[p]=models[m]['pars'][p]
    print('theta={:.2f}, d_L={:.2f} Mpc'.format(np.rad2deg(pars['thetaObs']),pars['d_L']*u.cm.to(u.Mpc)))
    models[m]['Fnu'] = grb.fluxDensity(t, nu, **pars)
    noise=np.random.normal(size=len(t[:,0]))*1e-9
    models[m]['Fnu'][:,0] = models[m]['Fnu'][:,0]+np.abs(noise)

# Plot!
print("Plot")

tday = t * grb.sec2day

fig, axes = plt.subplots(3,3,num=1,clear=True,sharex='all',sharey='all')
p=0
for m in models:
    x=int(p/3)
    y=p%3
    ax=axes[x,y]
    xray.plotModels(ax,tday,models[m],ylim=[1e-10,1e-3])
    # ax.plot(tday[:,0], models[m]['Fnu'][:,0], ls='-', label=m)
    # ax.set_xscale('log')
    # ax.set_yscale('log')
    # # ax.set_ylim(1e-10,1e-3)
    # ax.set_xlabel('time')
    # ax.set_ylabel('Flux (mJy)')
    # # ax.set_ylabel(r'$F_\nu$ (mJy)')
    # ax.set_xticks([1,7,30,365])
    # ax.set_xticklabels(['day','wk','mth','yr'])
    # ax.annotate(r'{:.1f}$^o$'.format(np.rad2deg(models[m]['pars']['thetaObs'])),(0.01,0.95),xycoords='axes fraction',va='top')
    # ax.annotate('{:.1f} Mpc'.format(models[m]['pars']['d_L']*u.cm.to(u.Mpc)),(0.99,0.95),xycoords='axes fraction',ha='right',va='top')
    # # ax[x,y].set_title(titles[p])
    # # if p==0:
    # #     ax[x,y].legend()
    p=p+1

fig.tight_layout()

print("Saving random_light_curves.png")
fig.savefig(os.path.join(plotDir,"random_light_curves_beamshape.png"))
# plt.close(fig)
plt.show()
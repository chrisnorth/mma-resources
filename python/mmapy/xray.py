import numpy as np
import json,string,os
from astropy import units as u
from astropy import constants as const
from matplotlib import pyplot as plt
from matplotlib import cm
import pandas as pd

class EventXray(object):
    def __init__(self,parent):
        self.parent=parent
        self.name=parent.name
        # self.chirpmass_Msun=parent.initParams.get('chirpmass_Msun',None)
        self.mtot=parent.initParams.get('totalmass_Msun',None)
        self.dist=parent.initParams.get('dist_Mpc',None)
        self.inc=parent.initParams.get('inclination_deg',None)
        return
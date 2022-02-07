import json, string, os
import numpy as np
from matplotlib import pyplot as plt
from . import gw,xray
from . import utils as ut
# from . import xray

class Event(object):
    def __init__(self,paramin,detectors={}):
        """
        Object for event. Created attributes based on parameters
        Inputs:
          * [dict]: dictionary of parameters
          * detectors [dict, optional]: detectors to use to initialise event
        Output: None
        """
        for p in paramin:
            self.initParams=paramin
        self.name=paramin.get('name','')
        self.messengers=paramin.get('messengers',{})
        self.datetime=paramin.get('datetime','')
        self.dist_Mpc=paramin.get('dist_Mpc',None)
        self._setLoc()
        self.vec=self.toVec()
        self.isGw=('GW' in self.messengers)
        self.isXray=('xray' in self.messengers)
        if self.isGw and detectors:
            self.nameGW=self.messengers['GW']
            self.gw=gw.EventGW(self)
        if self.isXray:
            self.nameXray=self.messengers['xray']
            self.xray=xray.EventXray(self)
        return
        
    def _setLoc(self):
        """
        Set location of event, based on initParams
        Inputs: None
        Output: None
        Attributes added:
          * lon: [list] 2-element list containing [longitude,latitude] (degrees)
          * lon: [float] longitude (degrees)
          * lat: [float] latitude (degrees)
        """
        if 'loc' in self.initParams:
            self.loc=ut.Location(self.initParams['loc'])
            # self.loc=self.initParams['loc']
        elif 'lon' in self.initParams and 'lat' in self.initParams:
            self.loc=ut.Location([self.initParams['lon'],self.initParams['lat']])
        self.lon=self.loc.loc[0]
        self.lat=self.loc.loc[1]
        return

    def toVec(self):
        """
        Convert lon,lat to a unit vector
        Inputs: None
        Output: [numpy array (length 3)] unit vector
        """
        vec=np.array([np.cos(ut.d2r(self.lon))*np.cos(ut.d2r(self.lat)),
            np.sin(ut.d2r(self.lon))*np.cos(ut.d2r(self.lat)),
            np.sin(ut.d2r(self.lat))])
        return vec
        
    
def readInitParams(fileIn):
    """
    Read event and detector parameters from file, and convert to Event and Detector objects
    Inputs:
      * [string OR dict] filename to read parameters from (json format) OR dict of parameters
    Output: [dict] dict containing Event and Detector objects
    """
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'GWdetectors' in dataIn:
        dets={}
        for d in dataIn['GWdetectors']:
            dets[d]=gw.Detector(dataIn['GWdetectors'][d])
    if 'events' in dataIn:
        events={}
        for e in dataIn['events']:
            events[e]=Event(dataIn['events'][e],detectors=dets)
            
    initParams={'events':events,'detectors':dets}
    return(initParams)
    
def readEvents(fileIn):
    """
    Read event parameters from file, and convert to Event objects
    Inputs:
      * [string OR dict] filename to read event parameters from (json format) OR dict of parameters
    Output: [dict] dict containing Event objects
    """
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'events' in dataIn:
        eventsIn=dataIn['events']
    else:
        eventsIn=dataIn
    
    # detlist=[]
    events={}
    for e in eventsIn:
        events[e]=Event(eventsIn[e])
    
    return(events)

